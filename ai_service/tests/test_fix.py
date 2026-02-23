import os
import sys

# Ensure we can import ai_engine
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from ai_engine import AIEngine

def test_detection():
    print("Initializing AI Engine...")
    engine = AIEngine()
    
    # Path to a test image
    # Using one from the list: airpod_104_jpg.rf.1f5269f746b6397b0fca40c77a3c2b12.jpg
    test_image_dir = os.path.join(os.path.dirname(__file__), 'item.v8i.yolov8', 'test', 'images')
    image_name = "airpod_104_jpg.rf.1f5269f746b6397b0fca40c77a3c2b12.jpg"
    image_path = os.path.join(test_image_dir, image_name)
    
    if not os.path.exists(image_path):
        print(f"Error: Test image not found at {image_path}")
        # Try to find any jpg in the dir
        if os.path.exists(test_image_dir):
            files = [f for f in os.listdir(test_image_dir) if f.endswith('.jpg')]
            if files:
                image_path = os.path.join(test_image_dir, files[0])
                print(f"Using alternative image: {files[0]}")
            else:
                return
        else:
            return

    print(f"\nTesting detection on: {image_path}")
    
    # Test with default threshold (0.45 in current code)
    print("\n--- Detection with Default Threshold ---")
    detections = engine.detect_objects(image_path)
    print("Detections:", detections)
    
    # Test with lower threshold if supported (it is passed to detector)
    print("\n--- Detection with Lower Threshold (0.15) ---")
    detections_low = engine.detect_objects(image_path, conf_threshold=0.15)
    print("Detections (0.15):", detections_low)

    print("\n--- Detection with Ultra-Low Threshold (0.05) ---")
    detections_ultra = engine.detect_objects(image_path, conf_threshold=0.05)
    print("Detections (0.05):", detections_ultra)

if __name__ == "__main__":
    test_detection()
