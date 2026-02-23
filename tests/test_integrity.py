import os
from ai_engine import AIEngine
from PIL import Image

def test_integrity():
    print("Initializing Semantic Integrity Engine...")
    engine = AIEngine()
    
    # 1. Test Phone Override (using dummy black image with phone ratio)
    print("\n--- Testing Phone Override (Heuristic) ---")
    phone_img_path = "test_phone_heuristic.jpg"
    # Create an image with ~18:9 ratio
    img = Image.new('RGB', (1080, 2400), color = (0, 0, 0))
    img.save(phone_img_path)
    
    result = engine.detect_objects(phone_img_path)
    print(f"Status: {result['status']}")
    print(f"Primary: {result['primary_category']}")
    print(f"Tags: {result['secondary_tags']}")
    print(f"Needs Confirmation: {result['needs_user_confirmation']}")
    
    if "smartphone" in result['secondary_tags']:
        print("✅ PASS: Phone override triggered.")
    else:
        print("❌ FAILED: Phone override not triggered.")
        
    if os.path.exists(phone_img_path):
        os.remove(phone_img_path)

    # 2. Test Low Confidence / No Objects
    print("\n--- Testing Empty/Low Confidence ---")
    empty_img_path = "test_empty.jpg"
    img = Image.new('RGB', (640, 640), color = (255, 255, 255))
    img.save(empty_img_path)
    
    result = engine.detect_objects(empty_img_path)
    print(f"Status: {result['status']}")
    
    if result['status'] == "LOW_CONFIDENCE":
         print("✅ PASS: Correctly handled empty image.")
    else:
         print(f"❌ FAILED: Should be LOW_CONFIDENCE, got {result['status']}")

    if os.path.exists(empty_img_path):
        os.remove(empty_img_path)

if __name__ == "__main__":
    test_integrity()
