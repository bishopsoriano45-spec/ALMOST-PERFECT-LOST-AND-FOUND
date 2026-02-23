import requests
import shutil


def download_image(url, filename):
    print(f"Downloading {url} to {filename}...")
    try:
        response = requests.get(url, stream=True)
        if response.status_code == 200:
            with open(filename, 'wb') as f:
                response.raw.decode_content = True
                shutil.copyfileobj(response.raw, f)
            print(f"✅ Download successful: {filename}")
        else:
            print(f"❌ Download failed: {response.status_code}")
    except Exception as e:
        print(f"❌ Error: {e}")

download_image("https://raw.githubusercontent.com/ultralytics/yolov5/master/data/images/zidane.jpg", "laptop_test.jpg")
download_image("https://raw.githubusercontent.com/ultralytics/yolov5/master/data/images/bus.jpg", "dog_test.jpg") # Renaming to dog_test for compatibility with verify script plan, or just keeping it simple
