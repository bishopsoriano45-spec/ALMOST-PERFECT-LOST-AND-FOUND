from ultralytics import YOLO
import os
import shutil

def train_custom_model(dataset_yaml_path, epochs=10, img_size=640, batch=16, model_name='yolov8m.pt', project_name='lost_items_model'):
    """
    Trains a YOLOv8 model on a custom dataset.
    """
    # Check for existing checkpoint to resume
    last_ckpt = os.path.join('runs', 'detect', project_name, 'weights', 'last.pt')
    resume_training = False
    
    if os.path.exists(last_ckpt):
        print(f"Found checkpoint at {last_ckpt}. Resuming training...")
        model = YOLO(last_ckpt)
        resume_training = True
    else:
        print(f"Initializing model {model_name}...")
        model = YOLO(model_name)

    # Train the model
    print(f"Starting training for {epochs} epochs...")
    results = model.train(
        data=dataset_yaml_path,
        epochs=epochs,
        imgsz=img_size,
        project='runs/detect',
        name=project_name,
        device='cpu',
        exist_ok=True,
        resume=resume_training,
        batch=batch
    )
    
    # Path where YOLO saves the best model
    best_model_path = os.path.join('runs', 'detect', project_name, 'weights', 'best.pt')
    
    # Destination path for the AI service
    # Ensure models directory exists
    models_dir = os.path.join(os.path.dirname(__file__), 'models')
    os.makedirs(models_dir, exist_ok=True)
    
    target_path = os.path.join(models_dir, 'unified_best.pt')
    
    if os.path.exists(best_model_path):
        print(f"Training completed. Copying best model to {target_path}")
        shutil.copy(best_model_path, target_path)
        print("Model deployed successfully.")
    else:
        print(f"Warning: Could not find trained model at {best_model_path}")

    return results

if __name__ == '__main__':
    # Define dataset path
    # Using the item.v8i.yolov8 dataset
    dataset_yaml = r'C:\Users\HYAKIMARU\Downloads\ALMOST PERFECT LOST AND FOUND\ai_service\dataset\item.v8i.yolov8\data.yaml'
    
    # Verify dataset exists
    if not os.path.exists(dataset_yaml):
        print(f"Error: Dataset configuration file not found at {dataset_yaml}")
        exit(1)

    # Recommended for high accuracy: 50-100 epochs.
    # User should run this overnight or on GPU.
    # Recommended for high accuracy: 50-100 epochs.
    # User should run this overnight or on GPU.
    # batch=1 to minimize memory usage on CPU (even if slow)
    train_custom_model(dataset_yaml, epochs=50, batch=1)
