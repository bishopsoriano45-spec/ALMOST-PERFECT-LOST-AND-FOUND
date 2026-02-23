
import requests
import os
import json
import time

# Configuration
API_URL = "http://localhost:3000/api"
AI_URL = "http://localhost:5000"
TEST_IMAGES_DIR = "test_images"

# Colors for output
class Colors:
    HEADER = '\033[95m'
    OKBLUE = '\033[94m'
    OKGREEN = '\033[92m'
    WARNING = '\033[93m'
    FAIL = '\033[91m'
    ENDC = '\033[0m'

def log(message, type="info"):
    if type == "info":
        print(f"{Colors.OKBLUE}[INFO]{Colors.ENDC} {message}")
    elif type == "success":
        print(f"{Colors.OKGREEN}[SUCCESS]{Colors.ENDC} {message}")
    elif type == "warning":
        print(f"{Colors.WARNING}[WARN]{Colors.ENDC} {message}")
    elif type == "error":
        print(f"{Colors.FAIL}[ERROR]{Colors.ENDC} {message}")
    else:
        print(message)

def run_test():
    log("Starting Comprehensive System Test...", "info")
    
    # 1. Check Services Health
    try:
        backend_health = requests.get(f"{API_URL}/health").json()
        log(f"Backend Health: {backend_health}", "success")
    except Exception as e:
        log(f"Backend Unreachable: {e}", "error")
        return

    try:
        ai_health = requests.get(f"{AI_URL}/health").json()
        log(f"AI Service Health: {ai_health}", "success")
    except Exception as e:
        log(f"AI Service Unreachable: {e}", "error")
        return

    # 2. Get Test Images
    if not os.path.exists(TEST_IMAGES_DIR):
        log(f"Test images directory not found: {TEST_IMAGES_DIR}", "error")
        return

    images = [f for f in os.listdir(TEST_IMAGES_DIR) if f.endswith(('.jpg', '.png'))]
    if not images:
        log("No images found in test_images/", "warning")
        return

    report = []
    
    for img_name in images:
        img_path = os.path.join(TEST_IMAGES_DIR, img_name)
        log(f"\n--- Testing Image: {img_name} ---", "info")
        
        # Step A: AI Detection
        log(f"Step A: Sending to AI Service ({AI_URL}/detect)...")
        ai_start = time.time()
        ai_result = None
        try:
            with open(img_path, 'rb') as f:
                response = requests.post(f"{AI_URL}/detect", files={'file': f})
            
            if response.status_code == 200:
                ai_result = response.json()
                log(f"AI Response: {json.dumps(ai_result, indent=2)}", "success")
                log(f"AI Latency: {time.time() - ai_start:.2f}s", "info")
            else:
                log(f"AI Service Failed: {response.text}", "error")
                continue
        except Exception as e:
            log(f"AI Request Error: {e}", "error")
            continue

        # Check for fallback usage (inferred from logs or confidence)
        # Note: 'failed_used' isn't explicitly in the JSON from my previous code unless I added it?
        # I added 'is_relevant' boolean in internal logic but did I pass it to JSON? 
        # Let's check api response structure.
        # It has "predicted_class", "confidence".
        
        # Step B: Backend Submission
        log(f"Step B: Submitting to Backend ({API_URL}/items/found)...")
        
        # Construct metadata exactly as the frontend would
        # The frontend sends 'ai_metadata' as a JSON string
        ai_metadata = {
            "category": ai_result.get("predicted_class"),
            "confidence": ai_result.get("confidence"),
            "features": ai_result.get("features"),
            "bboxes": [d.get("bbox") for d in ai_result.get("detections", [])]
        }
        
        payload = {
            "title": f"Test Item - {ai_result.get('predicted_class')}",
            "description": f"Automated test upload of {img_name}. Detected: {ai_result.get('predicted_class')}",
            "category": ai_result.get("predicted_class"),
            "location": "Test Lab",
            "date_found": time.strftime("%Y-%m-%dT%H:%M:%S.000Z"),
            # Use 'guest' or a known existing user ID to avoid FK constraint error
            "user_id": "guest", 
            "ai_metadata": json.dumps(ai_metadata)
        }
        
        try:
            with open(img_path, 'rb') as f:
                files = {'image': (img_name, f, 'image/jpeg')}
                backend_response = requests.post(f"{API_URL}/items/found", data=payload, files=files)
            
            if backend_response.status_code == 201:
                item_data = backend_response.json()
                log(f"Backend Saved Item ID: {item_data.get('id')}", "success")
                
                # Check Matches
                matches = item_data.get('matches', [])
                match_count = len(matches)
                if match_count > 0:
                    log(f"🎉 Matches Found: {match_count}", "success")
                    for m in matches:
                        log(f"   - Match: {m.get('item', {}).get('title')} (Score: {m.get('score'):.2f})", "info")
                else:
                    log("No matches found (expected if DB empty)", "info")
                
                report.append({
                    "image": img_name,
                    "class": ai_result.get("predicted_class"),
                    "conf": ai_result.get("confidence"),
                    "status": "Success",
                    "matches": match_count
                })

            else:
                log(f"Backend Failed: {backend_response.status_code} - {backend_response.text}", "error")
                report.append({"image": img_name, "status": "Backend Fail"})

        except Exception as e:
            log(f"Backend Request Error: {e}", "error")
            continue

    # 3. Generate Report
    log("\n=== TEST REPORT SUMMARY ===", "info")
    print(f"{'Image':<20} | {'Class':<15} | {'Conf':<6} | {'Status':<10} | {'Matches':<5}")
    print("-" * 70)
    for r in report:
        print(f"{r.get('image', ''):<20} | {r.get('class', 'N/A'):<15} | {r.get('conf', 0):<6.2f} | {r.get('status'):<10} | {r.get('matches', 0):<5}")

if __name__ == "__main__":
    run_test()
