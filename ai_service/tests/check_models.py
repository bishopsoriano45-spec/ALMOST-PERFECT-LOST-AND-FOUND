import os
from ultralytics import YOLO

def check_models():
    base_dir = os.path.join(os.path.dirname(__file__), 'models')
    models = ['electronics_best.pt', 'unified_best.pt', 'best.pt']
    
    print(f"Checking models in {base_dir}...\n")
    
    for model_name in models:
        path = os.path.join(base_dir, model_name)
        if os.path.exists(path):
            print(f"--- MODEL: {model_name} ---")
            try:
                model = YOLO(path)
                print(f"Classes ({len(model.names)}):")
                print(model.names)
            except Exception as e:
                print(f"Error loading model: {e}")
        else:
            print(f"--- MODEL: {model_name} (NOT FOUND) ---")
        print("\n")

    # Check base model in root
    base_model_path = os.path.join(os.path.dirname(__file__), 'yolov8m.pt')
    if os.path.exists(base_model_path):
        print(f"--- MODEL: yolov8m.pt (Base - COCO) ---")
        try:
            model = YOLO(base_model_path)
            print(f"Classes ({len(model.names)}):")
            # Print only first 10 classes to avoid clutter
            print(list(model.names.values())[:10], "...")
        except Exception as e:
            print(f"Error loading model: {e}")
    else:
        print(f"--- MODEL: yolov8m.pt (Base) (NOT FOUND) ---")
    print("\n")

if __name__ == "__main__":
    check_models()
