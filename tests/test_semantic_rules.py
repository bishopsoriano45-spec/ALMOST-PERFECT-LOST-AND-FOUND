from ai_engine import AIEngine
import pprint

def test_semantic_rules():
    print("Initializing AI Engine for Semantic Rules Test...")
    engine = AIEngine()
    
    # Test Data: "Other" Category Protection
    print("\n--- Testing 'Other' Category Protection ---")
    
    # 1. High Confidence "Other" -> Should Cap
    res1 = engine._enforce_category("random_object", 0.95)
    print(f"Case 1 (High Conf Unknown): {res1}")
    if res1.get("cap_confidence") == 0.75 and res1["needs_confirmation"]:
        print("✅ PASS: Capped high confidence unknown object.")
    else:
        print("❌ FAIL: Did not cap high confidence unknown.")

    # 2. Normal Category -> No Cap
    res2 = engine._enforce_category("laptop", 0.90)
    print(f"Case 2 (Known Category): {res2}")
    if res2["category"] == "electronics" and not res2.get("needs_confirmation"):
        print("✅ PASS: Allowed known category.")
    else:
        print("❌ FAIL: Incorrectly handled known category.")

    # Test Data: Confidence Normalization
    print("\n--- Testing Confidence Normalization ---")
    
    # 3. COCO + Known -> 0.75 Multiplier
    conf3 = engine._correct_confidence(0.90, "coco", "electronics")
    print(f"Case 3 (COCO Electronics 0.90): {conf3}")
    if conf3 == 0.68: # 0.9 * 0.75 = 0.675 -> 0.68
        print("✅ PASS: Applied COCO penalty.")
    else:
         print(f"❌ FAIL: Expected 0.68, got {conf3}")

    # 4. Custom + Known -> 1.0 Multiplier
    conf4 = engine._correct_confidence(0.90, "custom", "electronics")
    print(f"Case 4 (Custom Electronics 0.90): {conf4}")
    if conf4 == 0.90:
        print("✅ PASS: Applied Custom bonus (no penalty).")
    else:
        print(f"❌ FAIL: Expected 0.90, got {conf4}")

    # Test Data: Embedding Guard
    print("\n--- Testing Embedding Guard ---")
    
    # 5. Weak Detection -> No Embedding
    emb5 = engine._extract_features_safe("dummy.jpg", [{"label": "foo"}], 0.50)
    print(f"Case 5 (Low Conf 0.50): Embedding Length = {len(emb5)}")
    if len(emb5) == 0:
        print("✅ PASS: Skipped embedding for low confidence.")
    else:
        print("❌ FAIL: Generated embedding for low confidence.")

if __name__ == "__main__":
    test_semantic_rules()
