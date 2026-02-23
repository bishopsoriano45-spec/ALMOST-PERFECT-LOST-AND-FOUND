from ai_engine import AIEngine
import pprint

def test_json_safety():
    print("Initializing AI Engine for Validation Test...")
    engine = AIEngine()
    
    # Mock invalid inputs
    test_cases = [
        # Case 1: Minimal failures
        {}, 
        # Case 2: Wrong Types
        {
            "status": "SUCCESS",
            "primary_category": None, # Should be string
            "secondary_tags": "not_a_list", # Should be list
            "confidence": "high" # Should be float
        },
        # Case 3: Malformed Detections
        {
            "status": "SUCCESS",
            "detections": [
                None,
                {"confidence": 2.5}, # Bad confidence
                {"label": 123}, # Bad label
                {"predicted_class": "valid", "confidence": 0.9, "model_source": "custom"} # Valid
            ]
        }
    ]

    print("\n--- Running Validation Tests ---")
    for i, case in enumerate(test_cases):
        print(f"\nExample {i+1}: Input = {case}")
        safe_output = engine._validate_final_output(case)
        pprint.pprint(safe_output)
        
        # Assertions
        assert safe_output["primary_category"] is not None
        assert isinstance(safe_output["secondary_tags"], list)
        assert isinstance(safe_output["confidence"], float)
        assert isinstance(safe_output["detections"], list)
        
        for d in safe_output["detections"]:
             assert isinstance(d["label"], str)
             assert isinstance(d["confidence"], float)
             assert "source" in d

    print("\n✅ PASS: All JSON Safety Tests passed.")

if __name__ == "__main__":
    test_json_safety()
