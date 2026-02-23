import os
import sys
from ai_engine import AIEngine
import numpy as np

def test_strict_orchestration():
    print("Initializing AI Engine...")
    engine = AIEngine()
    
    # Path to test image
    test_img = os.path.join("ai_service", "laptop_test.jpg") # Should have 'tie'
    if not os.path.exists(test_img):
        print("⚠️ Test image not found, skipping detection test.")
        return

    print(f"\n--- Testing Detect Objects on {test_img} ---")
    result = engine.detect_objects(test_img)
    
    # Verify Strict Output Format
    expected_keys = {
        "status", "primary_category", "secondary_tags", 
        "detections", "embedding_generated", "matching_candidates"
    }
    
    missing_keys = expected_keys - result.keys()
    if missing_keys:
        print(f"❌ FAILED: Missing keys in result: {missing_keys}")
    else:
        print("✅ PASS: Output format contains all required keys.")
        print(f"   Status: {result['status']}")
        print(f"   Primary: {result['primary_category']}")
        print(f"   Tags: {result['secondary_tags']}")
        print(f"   Embedding Generated: {result['embedding_generated']}")

    # Verify Matching Logic
    print("\n--- Testing Match Candidates ---")
    
    # Mock Target
    target_vec = [1.0, 0.0, 0.0]
    target_cat = "electronics"
    target_tags = ["laptop", "screen"]
    
    # Mock Candidates
    candidates = [
        # Match (Perfect)
        {
            "item_id": "item_1",
            "primary_category": "electronics",
            "secondary_tags": ["laptop", "keyboard"], # Shared 'laptop'
            "embedding_vector": [1.0, 0.0, 0.0] # Sim = 1.0
        },
        # Match (Good)
        {
            "item_id": "item_2",
            "primary_category": "electronics",
            "secondary_tags": ["screen"], # Shared 'screen'
            "embedding_vector": [0.8, 0.6, 0.0] # Sim = 0.8 (normed?) -> if [0.8, 0.6] norm=1. 1*0.8 + 0 = 0.8 -> REVIEW
        },
        # Mismatch (Category)
        {
            "item_id": "item_3",
            "primary_category": "clothing",
            "secondary_tags": ["laptop"], 
            "embedding_vector": [1.0, 0.0, 0.0]
        },
        # Mismatch (Tags)
        {
            "item_id": "item_4",
            "primary_category": "electronics",
            "secondary_tags": ["mouse"], # No overlap
            "embedding_vector": [1.0, 0.0, 0.0]
        }
    ]
    
    matches = engine.match_candidates(target_vec, target_cat, target_tags, candidates)
    
    print(f"Matches Found: {len(matches)}")
    for m in matches:
        print(f"  ID: {m['item_id']}, Score: {m['similarity_score']}, Level: {m['match_level']}")
        
    # Assertions
    ids = [m['item_id'] for m in matches]
    if "item_1" in ids and "item_2" in ids:
         print("✅ PASS: Correct candidates matched.")
    else:
         print("❌ FAILED: Missing expected matches.")
         
    if "item_3" not in ids and "item_4" not in ids:
         print("✅ PASS: Correct candidates filtered out.")
    else:
         print("❌ FAILED: Failed to filter candidates.")

if __name__ == "__main__":
    test_strict_orchestration()
