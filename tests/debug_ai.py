import os
import sys

# Add ai_service to path
sys.path.append(os.path.join(os.getcwd(), 'ai_service'))

try:
    from ai_engine import AIEngine
    print("Initializing AI Engine...")
    engine = AIEngine()
    
    # Check custom detector
    if hasattr(engine, 'custom_detector') and engine.custom_detector:
        print(f"\nCustom Model: {engine.custom_detector.model_path if hasattr(engine.custom_detector, 'model_path') else 'Unknown path'}")
        print(f"Custom Classes: {engine.custom_detector.names}")
    
    # Check COCO detector
    if hasattr(engine, 'coco_detector') and engine.coco_detector:
        print(f"\nCOCO Model: {engine.coco_detector.model_path if hasattr(engine.coco_detector, 'model_path') else 'Unknown path'}")
    
    # Create valid dummy image if none exists
    test_img = "test_images/test_debug.jpg"
    if not os.path.exists(test_img):
        from PIL import Image
        img = Image.new('RGB', (640, 640), color = 'red')
        img.save(test_img)
        print(f"\nCreated dummy test image: {test_img}")
        
    print(f"\nRunning detection on {test_img}...")
    results = engine.detect_objects(test_img)
    print("\n=== Detection Results ===")
    print(f"Status: {results.get('status')}")
    print(f"Primary Category: {results.get('primary_category')}")
    print(f"Confidence: {results.get('confidence')}")
    print(f"Feature Status: {results.get('feature_status')}")
    print(f"Features: {results.get('features')}")
    print(f"\nRaw Results:")
    print(results)
    
except Exception as e:
    print(f"\nERROR: {e}")
    import traceback
    traceback.print_exc()
