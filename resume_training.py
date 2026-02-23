from ultralytics import YOLO
import os

def resume_training():
    # Path to the last checkpoint (found in nested structure)
    checkpoint_path = r"runs/detect/runs/detect/lost_items_model/weights/last.pt"
    
    if not os.path.exists(checkpoint_path):
        print(f"Error: Checkpoint not found at {checkpoint_path}")
        return

    print(f"Resuming training from {checkpoint_path}...")
    
    # Load the model
    model = YOLO(checkpoint_path)
    
    # Resume training
    # Note: resume=True automatically loads the previous training arguments
    results = model.train(resume=True)
    
    print("Training resumed/completed.")

if __name__ == "__main__":
    resume_training()
