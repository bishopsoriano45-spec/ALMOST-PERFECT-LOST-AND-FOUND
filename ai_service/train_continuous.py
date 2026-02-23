import os
import sys
import argparse
import psycopg2
import requests
from ultralytics import YOLO
import shutil
from datetime import datetime
import json

# Configuration
DB_HOST = os.getenv('DB_HOST', 'localhost')
DB_NAME = os.getenv('DB_NAME', 'lostandfound')
DB_USER = os.getenv('DB_USER', 'postgres')
DB_PASSWORD = os.getenv('DB_PASSWORD', '10232003') # Should match .env
AI_SERVICE_URL = 'http://localhost:5000'

def get_db_connection():
    return psycopg2.connect(
        host=DB_HOST,
        database=DB_NAME,
        user=DB_USER,
        password=DB_PASSWORD
    )

def main():
    parser = argparse.ArgumentParser(description='Continuous Training Script')
    parser.add_argument('--epochs', type=int, default=5, help='Number of epochs to train')
    args = parser.parse_args()

    print("Starting continuous training pipeline...")

    # 1. Fetch Feedback Data
    conn = get_db_connection()
    cur = conn.cursor()
    
    try:
        # Get unprocessed feedback
        cur.execute("SELECT id, image_url, actual_class FROM ai_feedback WHERE processed = FALSE")
        rows = cur.fetchall()
        
        if not rows:
            print("No new feedback to process.")
            return

        print(f"Found {len(rows)} new feedback items.")
        
        # Load model early to get class names
        model_path = os.path.join(os.path.dirname(__file__), 'models', 'unified_best.pt')
        if not os.path.exists(model_path):
            print("unified_best.pt not found, using yolov8m.pt for initial mapping.")
            model_path = 'yolov8m.pt' # Fallback
            
        model = YOLO(model_path)
        # Create dynamic class map
        # Normalize keys to handle case sensitivity if needed, but strict is better for now
        name_to_id = {v: k for k, v in model.names.items()}
        print(f"Loaded {len(name_to_id)} classes from model.")

        # 2. Prepare Dataset
        dataset_dir = os.path.join(os.path.dirname(__file__), 'dataset')
        images_dir = os.path.join(dataset_dir, 'images', 'train')
        labels_dir = os.path.join(dataset_dir, 'labels', 'train')
        
        os.makedirs(images_dir, exist_ok=True)
        os.makedirs(labels_dir, exist_ok=True)
        
        processed_ids = []
        
        for row in rows:
            feedback_id, image_url, label = row
            
            # Resolve image path
            possible_paths = [
                os.path.join(os.path.dirname(__file__), '..', image_url), 
                os.path.join(os.path.dirname(__file__), '..', 'server', image_url),
                image_url 
            ]
            
            src_path = None
            for p in possible_paths:
                if os.path.exists(p):
                    src_path = p
                    break
            
            if src_path:
                # Copy image
                filename = os.path.basename(src_path)
                dest_path = os.path.join(images_dir, filename)
                shutil.copy(src_path, dest_path)
                
                # Get class ID
                class_id = name_to_id.get(label)
                
                # Try case-insensitive matching if exact match fails
                if class_id is None:
                    for name, id in name_to_id.items():
                        if name.lower() == label.lower():
                            class_id = id
                            break
                            
                if class_id is not None:
                    txt_filename = os.path.splitext(filename)[0] + ".txt"
                    with open(os.path.join(labels_dir, txt_filename), 'w') as f:
                        f.write(f"{class_id} 0.5 0.5 1.0 1.0\n")
                    processed_ids.append(feedback_id)
                else:
                    print(f"Warning: Unknown label '{label}' for image {src_path}. Available classes: {list(name_to_id.keys())[:5]}...")
            else:
                print(f"Warning: Image file not found for {image_url}")

        if not processed_ids:
            print("No valid data to train on.")
            return

        # 3. Train Model
        print("Training YOLO model...")
        results = model.train(
            data=os.path.join(dataset_dir, 'data.yaml'), 
            epochs=args.epochs, 
            imgsz=640,
            project=os.path.join(os.path.dirname(__file__), 'runs', 'detect'),
            name='continuous_train',
            exist_ok=True
        )
        
        # Capture Metrics
        # access result.box.map50, result.box.p, result.box.r
        # 'results' is usually a list of Results objects or a single one? 
        # In newer ultralytics, model.train() returns object with .results_dict?
        # Let's try safely accessing common attributes
        
        try:
             # Standard Ultralytics return object attributes
             map50 = results.box.map50
             precision = results.box.p.mean() # Average over classes
             recall = results.box.r.mean()
             print(f"Training Metrics - mAP50: {map50:.4f}, P: {precision:.4f}, R: {recall:.4f}")
        except Exception as e:
            print(f"Warning: Could not parse exact metrics ({e}), using defaults.")
            map50 = 0.0
            precision = 0.0
            recall = 0.0

        # 4. Save New Model
        new_version = f"v1.1.{int(datetime.now().timestamp())}"
        new_model_path = os.path.join(os.path.dirname(__file__), 'models', f"{new_version}.pt")
        
        trained_weights = os.path.join(os.path.dirname(__file__), 'runs', 'detect', 'continuous_train', 'weights', 'best.pt')
        
        if os.path.exists(trained_weights):
            shutil.copy(trained_weights, new_model_path)
            print(f"New model saved to {new_model_path}")
            
            # 5. Update Database with metrics
            cur.execute("""
                INSERT INTO model_versions (version_number, file_path, accuracy, precision, recall, training_samples_count, is_active)
                VALUES (%s, %s, %s, %s, %s, %s, %s)
                RETURNING id
            """, (new_version, new_model_path, map50, precision, recall, len(processed_ids), False)) 
            
            # Mark feedback as processed
            cur.execute("UPDATE ai_feedback SET processed = TRUE WHERE id = ANY(%s)", (processed_ids,))
            
            conn.commit()
            
            # 6. Hot Reload
            print("Triggering AI Service reload...")
            try:
                resp = requests.post(f"{AI_SERVICE_URL}/reload", data={'model_path': new_model_path})
                if resp.status_code == 200:
                    print("✅ AI Service reloaded successfully!")
                    cur.execute("UPDATE model_versions SET is_active = TRUE WHERE version_number = %s", (new_version,))
                    conn.commit()
                else:
                    print(f"❌ Failed to reload AI Service: {resp.text}")
            except Exception as e:
                print(f"❌ Failed to contact AI Service: {e}")

        else:
            print("❌ Training failed to produce best.pt")

    except Exception as e:
        conn.rollback()
        print(f"Error during training pipeline: {e}")
        raise
    finally:
        cur.close()
        conn.close()

if __name__ == "__main__":
    main()
