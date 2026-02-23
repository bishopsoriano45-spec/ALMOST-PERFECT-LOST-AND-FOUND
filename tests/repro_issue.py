import requests
import os

# Use existing test image if available
import os
image_path = "ai_service/test_coco.jpg"
if not os.path.exists(image_path):
    print("Test image not found, using dummy.")
    if not os.path.exists("test_image.jpg"):
        from PIL import Image
        img = Image.new('RGB', (100, 100), color = 'red')
        img.save('test_image.jpg')
    image_path = "test_image.jpg"

url = "http://localhost:5000/detect"
files = {'file': open(image_path, 'rb')}

try:
    response = requests.post(url, files=files)
    print("Status Code:", response.status_code)
    try:
        data = response.json()
        print("Response JSON Keys:", data.keys())
        print("Predicted Class:", data.get("predicted_class"))
        print("Detections:", data.get("detections"))
        if data.get("detections"):
            first_det = data["detections"][0]
            print("First Detection Keys:", first_det.keys())
            print("Has 'class' key?", 'class' in first_det)
    except Exception as e:
        print("Failed to parse JSON:", e)
        print("Raw text:", response.text)
except Exception as e:
    print("Request failed:", e)
