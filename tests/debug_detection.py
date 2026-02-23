import sys
import os

# Ensure we can import ai_engine
sys.path.append(os.path.join(os.getcwd(), 'ai_service'))

from ai_engine import AIEngine

def test_engine():
    print("Initializing Engine...")
    engine = AIEngine()
    
    image_path = "ai_service/test_images/laptop_test.jpg"
    if not os.path.exists(image_path):
        print("Creating dummy image...")
        from PIL import Image
        img = Image.new('RGB', (100, 100), color='red')
        img.save(image_path)
    
    print(f"Running detection on {image_path}...")
    result = engine.detect_objects(image_path)
    
    print(f"\n=== Detection Results ===")
    print(f"Status: {result.get('status')}")
    print(f"Primary Category: {result.get('primary_category')}")
    print(f"Confidence: {result.get('confidence')}")
    print(f"Feature Status: {result.get('feature_status')}")
    print(f"Features: {result.get('features')}")
    
    # Check detections list
    detections = result.get('detections', [])
    print(f"\nDetections found: {len(detections)}")
    
    for i, det in enumerate(detections):
        print(f"\nDetection {i+1}:")
        print(f"  Class: {det.get('class_name')}")
        print(f"  Confidence: {det.get('confidence')}")
        print(f"  Category: {det.get('category')}")
    
    # Check for undefined features
    features = result.get('features', [])
    if features and isinstance(features, list):
        for f in features:
            if f == "undefined":
                print("\n❌ FOUND 'undefined' STRING IN FEATURES!")
            if f is None:
                print("\n❌ FOUND None IN FEATURES!")

if __name__ == "__main__":
    test_engine()
