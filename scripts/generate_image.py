from PIL import Image
import os

img = Image.new('RGB', (100, 100), color = 'white')
img.save('scripts/test_image.jpg')
print("Created test_image.jpg")
