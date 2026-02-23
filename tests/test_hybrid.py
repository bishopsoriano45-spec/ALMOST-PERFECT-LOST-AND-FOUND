import os
import sys
from ai_engine import AIEngine
import cv2

def test_hybrid():
    # Initialize Engine (Should load both models)
    print("Initializing AI Engine...")
    engine = AIEngine()
    
    # Check loaded models
    print(f"Custom Model Loaded: {engine.custom_detector is not None}")
    print(f"COCO Model Loaded: {engine.coco_detector is not None}")
    
    # Test on an image that should have both (e.g., person + phone)
    # If no such image exists, use 'test_image.jpg' or similar
    test_img = os.path.join("ai_service", "laptop_test.jpg")
    if not os.path.exists(test_img):
        # Fallback to test_image.jpg
        test_img = "test_image.jpg"
    
    print(f"Testing on {test_img}...")
    if os.path.exists(test_img):
        result = engine.detect_objects(test_img) # Conf threshold is now internal
        detections = result.get('detections', [])
        
        print("\n--- Detections ---")
        for det in detections:
            print(f"Class: {det['label']}, Conf: {det['confidence']:.2f}")
            
    else:
        print("No test image found.")

if __name__ == "__main__":
    test_hybrid()
