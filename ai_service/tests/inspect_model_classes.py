from ultralytics import YOLO
import sys

try:
    model_path = r'C:\Users\HYAKIMARU\Downloads\ALMOST PERFECT LOST AND FOUND\ai_service\models\unified_best.pt'
    print(f"Loading model: {model_path}")
    model = YOLO(model_path)
    
    print("\n--- Model Classes ---")
    for id, name in model.names.items():
        print(f"{id}: {name}")
    print("---------------------\n")
    
    if len(model.names) == 10:
        print("RESULT: Model has ONLY custom classes (10 total).")
    else:
        print(f"RESULT: Model has {len(model.names)} classes.")
        
except Exception as e:
    print(f"Error: {e}")
