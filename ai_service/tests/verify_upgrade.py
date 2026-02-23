import requests
import os
import sys

# Define URL
url = "http://127.0.0.1:5000/detect"

# Create a dummy image for testing if not exists
image_path = "test_image.jpg"
if not os.path.exists(image_path):
    import numpy as np
    import cv2
    # Create a blank image
    img = np.zeros((640, 640, 3), dtype=np.uint8)
    # Draw a rectangle to simulate an object (maybe)
    cv2.rectangle(img, (100, 100), (500, 500), (255, 255, 255), -1)
    cv2.imwrite(image_path, img)

print(f"Testing /detect endpoint with {image_path}...")

files = {'file': open(image_path, 'rb')}

try:
    response = requests.post(url, files=files)
    
    if response.status_code == 200:
        print("✅ Response 200 OK")
        data = response.json()
        print("Response JSON keys:", data.keys())
        
        # Check required fields
        required_keys = ["predicted_class", "confidence", "features", "model_version"]
        missing = [key for key in required_keys if key not in data]
        
        if missing:
            print(f"❌ Missing keys: {missing}")
        else:
            print("✅ All required keys present")
            print(f"Predicted Class: {data['predicted_class']}")
            print(f"Model Version: {data['model_version']}")
            print(f"Features length: {len(data['features'])}")
            
    else:
        print(f"❌ Failed: {response.status_code}")
        print(response.text)
        
except Exception as e:
    print(f"❌ Connection Error: {e}")
    print("Make sure the server is running!")
