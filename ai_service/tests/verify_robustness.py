import requests
import os
import sys
import base64
import json

# Define URL
url = "http://127.0.0.1:5000/detect"

# Helper to print results
def print_result(name, response):
    print(f"\n--- Testing {name} ---")
    if response.status_code == 200:
        data = response.json()
        print("✅ Response 200 OK")
        print(f"Class: {data.get('predicted_class')}")
        print(f"Version: {data.get('model_version')}")
        if data.get('predicted_class', '').startswith('error'):
            print(f"⚠️ Returned Expected Error: {data.get('predicted_class')}")
    else:
        print(f"❌ Failed: {response.status_code}")
        print(response.text)

# 1. Test Valid Image File
image_path = "test_image.jpg"
if not os.path.exists(image_path):
    print("Creating dummy image...")
    import numpy as np
    import cv2
    img = np.zeros((640, 640, 3), dtype=np.uint8)
    cv2.rectangle(img, (100, 100), (500, 500), (255, 255, 255), -1)
    cv2.imwrite(image_path, img)

print(f"Testing File Upload with {image_path}...")
files = {'file': open(image_path, 'rb')}
try:
    response = requests.post(url, files=files)
    print_result("File Upload", response)
except Exception as e:
    print(f"❌ Connection Error: {e}")

# 2. Test Base64 Input
print("\nTesting Base64 Input...")
with open(image_path, "rb") as f:
    base64_str = base64.b64encode(f.read()).decode('utf-8')
    
data = {'image_data': base64_str}
try:
    response = requests.post(url, data=data)
    print_result("Base64 Input", response)
except Exception as e:
    print(f"❌ Connection Error: {e}")

# 3. Test Invalid Image (Text file masquerading as image)
print("\nTesting Invalid Image content...")
with open("fake_image.txt", "w") as f:
    f.write("This is not an image")

files = {'file': open("fake_image.txt", "rb")}
try:
    response = requests.post(url, files=files)
    print_result("Invalid File Content", response)
except Exception as e:
    print(f"❌ Connection Error: {e}")

# 4. Test Missing Input
print("\nTesting Missing Input...")
try:
    response = requests.post(url, data={})
    print_result("Missing Input", response)
except Exception as e:
    print(f"❌ Connection Error: {e}")

# Cleanup
if os.path.exists("fake_image.txt"):
    os.remove("fake_image.txt")
