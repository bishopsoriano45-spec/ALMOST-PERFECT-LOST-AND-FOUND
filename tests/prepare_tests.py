
import os
import requests
import shutil

TEST_DIR = "test_images"
if not os.path.exists(TEST_DIR):
    os.makedirs(TEST_DIR)

# URLs for test images (using reliable wikimedia/github sources)
IMAGES = {
    "laptop.jpg": "https://upload.wikimedia.org/wikipedia/commons/thumb/2/23/Personal_computer%2C_exploded_5.svg/640px-Personal_computer%2C_exploded_5.svg.png",
    "phone.jpg": "https://upload.wikimedia.org/wikipedia/commons/thumb/b/b6/Image_created_with_a_mobile_phone.png/640px-Image_created_with_a_mobile_phone.png",
    "bottle.jpg": "https://upload.wikimedia.org/wikipedia/commons/thumb/e/e4/Plastic_bottle_of_mineral_water.jpg/360px-Plastic_bottle_of_mineral_water.jpg",
    "dog.jpg": "https://upload.wikimedia.org/wikipedia/commons/thumb/8/8c/Polski_Owczarek_Nizinny_Ryjek.jpg/640px-Polski_Owczarek_Nizinny_Ryjek.jpg", # Irrelevant class check
    "keys_obscure.jpg": "https://upload.wikimedia.org/wikipedia/commons/thumb/f/f9/Keys_and_keychain.jpg/640px-Keys_and_keychain.jpg", # Might be obscure/unknown
    "backpack.jpg": "https://upload.wikimedia.org/wikipedia/commons/thumb/d/d7/Backpack_2.jpg/640px-Backpack_2.jpg"
}

def download_image(name, url):
    path = os.path.join(TEST_DIR, name)
    print(f"Downloading {name}...")
    try:
        headers = {'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'}
        response = requests.get(url, stream=True, timeout=10, headers=headers)
        if response.status_code == 200:
            with open(path, 'wb') as f:
                response.raw.decode_content = True
                shutil.copyfileobj(response.raw, f)
            print(f"✅ Saved {path}")
        else:
            print(f"❌ Failed to download {name}: {response.status_code}")
    except Exception as e:
        print(f"❌ Error downloading {name}: {e}")

if __name__ == "__main__":
    print("Preparing Test Images...")
    for name, url in IMAGES.items():
        download_image(name, url)
    print("Done.")
