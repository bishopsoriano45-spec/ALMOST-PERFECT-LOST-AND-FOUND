
import sys
import os

# Add current directory to path
sys.path.append(os.getcwd())

try:
    print("Attempting to import gemini_engine...")
    from gemini_engine import gemini_engine
    print("✅ Import successful!")
    
    if gemini_engine.client:
        print("✅ Client initialized")
    else:
        print("⚠️ Client is None (missing API key?)")
        
except Exception as e:
    print(f"❌ Import Failed: {e}")
    import traceback
    traceback.print_exc()
