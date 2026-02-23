import requests
import os
import sys
import json

# Define URL
url = "http://127.0.0.1:5000/detect"

# Helper to print results
def print_result(name, response):
    print(f"\n--- Testing {name} ---")
    if response.status_code == 200:
        data = response.json()
        print("✅ Response 200 OK")
        print(f"Top Class: {data.get('predicted_class')}")
        print(f"Version: {data.get('model_version')}")
        print(f"Detections Count: {len(data.get('detections', []))}")
        
        for det in data.get('detections', []):
            print(f" - {det['predicted_class']} ({det['confidence']:.2f})")
            
        if not data.get('detections') and data.get('predicted_class') == 'unknown':
             print("✅ Correctly identified as unknown")
    else:
        print(f"❌ Failed: {response.status_code}")
        print(response.text)

# 1. Test Dummy Image (Should be unknown as it's just a rectangle)
image_path = "test_coco.jpg"
if not os.path.exists(image_path):
    import numpy as np
    import cv2
    img = np.zeros((640, 640, 3), dtype=np.uint8)
    # Just generic noise/lines
    cv2.line(img, (0,0), (640,640), (255,255,255), 5)
    cv2.imwrite(image_path, img)

print(f"Testing with dummy image {image_path}...")
files = {'file': open(image_path, 'rb')}
try:
    response = requests.post(url, files=files)
    print_result("Dummy Image (Expect Unknown)", response)
except Exception as e:
    print(f"❌ Connection Error: {e}")

# 2. Test Downloaded Laptop Image
image_path = "laptop_test.jpg"
if os.path.exists(image_path):
    print(f"\nTesting with {image_path}...")
    files = {'file': open(image_path, 'rb')}
    try:
        response = requests.post(url, files=files)
        print_result("Laptop Image (Expect 'laptop' or 'keyboard')", response)
    except Exception as e:
        print(f"❌ Connection Error: {e}")
else:
    print(f"❌ Test image {image_path} not found.")

# 3. Test Irrelevant Image (Expect Fallback to 'bus' or 'person')
image_path = "dog_test.jpg"
if os.path.exists(image_path):
    print(f"\nTesting with {image_path} (Irrelevant Class)...")
    files = {'file': open(image_path, 'rb')}
    try:
        response = requests.post(url, files=files)
        print_result("Irrelevant Image (Expect Fallback)", response)
    except Exception as e:
        print(f"❌ Connection Error: {e}")
else:
    print(f"❌ Test image {image_path} not found.")
