import requests

url = "https://lost-found-ai.onrender.com/analyze-hybrid"
files = {'file': ('test.jpg', open('server/test_debug.jpg', 'rb'), 'image/jpeg')}
try:
    response = requests.post(url, files=files)
    print("Status:", response.status_code)
    print("Response:", response.text)
except Exception as e:
    print("Error:", str(e))
