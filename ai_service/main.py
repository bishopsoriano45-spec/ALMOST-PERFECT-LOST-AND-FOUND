import os
import sys

# Add current directory to path for imports
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from fastapi import FastAPI, File, UploadFile, HTTPException, Form
from fastapi.staticfiles import StaticFiles
from fastapi.middleware.cors import CORSMiddleware
import uvicorn
import shutil
import numpy as np
# from ultralytics import YOLO
# import cv2
# import faiss
from pydantic import BaseModel
from typing import Dict, Any

app = FastAPI()

# Add CORS middleware to allow frontend communication
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, specify exact origins
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Ensure uploads directory exists
UPLOAD_DIR = "uploads"
if not os.path.exists(UPLOAD_DIR):
    os.makedirs(UPLOAD_DIR)

from ai_engine import AIEngine

# Initialize AI Engine
engine = AIEngine()
from gemini_engine import gemini_engine, GeminiHandler


@app.get("/")
def read_root():
    return {"message": "Lost & Found AI Service is running"}

@app.get("/health")
def health_check():
    return {"status": "ok", "message": "AI Service is healthy"}

@app.post("/detect")
async def detect_objects(file: UploadFile = File(None), image_data: str = Form(None)):
    import base64
    import uuid
    from PIL import Image, UnidentifiedImageError
    
    file_location = None  # Track file for cleanup
    try:
        # 1. Validation: Ensure we have input
        if not file and not image_data:
            print("❌ Error: No file or image_data provided.")
            return {
                "predicted_class": "error_no_input",
                "confidence": 0.0,
                "features": [],
                "model_version": "error"
            }
            
        # 2. Save input to file
        # Use UUID to prevent collisions
        temp_filename = f"upload_{uuid.uuid4()}.jpg"
        file_location = os.path.join(UPLOAD_DIR, temp_filename)
        
        if file:
            # Validate File Size (Max 15MB)
            file.file.seek(0, 2)
            size = file.file.tell()
            file.file.seek(0)
            if size > 15 * 1024 * 1024:
                print(f"❌ Error: File too large ({size} bytes)")
                return {
                    "predicted_class": "error_file_too_large",
                    "confidence": 0.0,
                    "features": [],
                    "model_version": "error"
                }
            
            with open(file_location, "wb+") as file_object:
                shutil.copyfileobj(file.file, file_object)
        
        elif image_data:
            # Decode Base64
            try:
                # Remove data prefix if present (e.g., "data:image/jpeg;base64,")
                if "," in image_data:
                    image_data = image_data.split(",")[1]
                
                decoded_data = base64.b64decode(image_data)
                
                # Check size of decoded data
                if len(decoded_data) > 15 * 1024 * 1024:
                    print(f"❌ Error: Base64 image too large")
                    return {
                        "predicted_class": "error_file_too_large",
                        "confidence": 0.0,
                        "features": [],
                        "model_version": "error"
                    }

                with open(file_location, "wb") as f:
                    f.write(decoded_data)
            except Exception as e:
                print(f"❌ Base64 Decode Error: {e}")
                return {
                    "predicted_class": "error_invalid_base64",
                    "confidence": 0.0,
                    "features": [],
                    "model_version": "error"
                }

        # 3. Validate it's a real image
        try:
            with Image.open(file_location) as img:
                img.verify()
        except Exception as e:
            print(f"❌ Invalid Image File: {e}")
            return {
                "predicted_class": "error_invalid_image",
                "confidence": 0.0,
                "features": [],
                "model_version": "error"
            }

        # 4. Perform detection (Strict Orchestration)
        result = engine.detect_objects(file_location)
        
        # Log for debugging
        print(f"✅ Detection Status: {result['status']}")
        if result['status'] == "SUCCESS":
            print(f"🏷️ Primary: {result['primary_category']}")
            print(f"🏷️ Tags: {result['secondary_tags']}")
        
        return result

    except Exception as e:
        print(f"❌ Critical Endpoint Error: {e}")
        # Return a safe fallback JSON conforming to strict schema
        return {
            "status": "ERROR",
            "primary_category": "error",
            "secondary_tags": [],
            "detections": [],
            "confidence": 0.0,
            "embedding_generated": False,
            "matching_candidates": [],
            "error_detail": str(e)
        }
    finally:
        # FIX: Clean up uploaded file after processing to prevent disk space leak
        if file_location and os.path.exists(file_location):
            try:
                os.remove(file_location)
            except Exception as cleanup_error:
                print(f"Warning: Failed to cleanup file {file_location}: {cleanup_error}")

@app.post("/extract")
async def extract_features(file: UploadFile = File(...)):
    file_location = None  # Track file for cleanup
    try:
        file_location = f"{UPLOAD_DIR}/{file.filename}"
        with open(file_location, "wb+") as file_object:
            shutil.copyfileobj(file.file, file_object)
            
        embedding = engine.extract_features(file_location)
        
        return {
            "filename": file.filename,
            "embedding": embedding.tolist(),
            "message": "Feature extraction successful"
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        # FIX: Clean up uploaded file after processing
        if file_location and os.path.exists(file_location):
            try:
                os.remove(file_location)
            except Exception as cleanup_error:
                print(f"Warning: Failed to cleanup file {file_location}: {cleanup_error}")

@app.post("/match")
async def match_image(file: UploadFile = File(...)):
    # In a real app, this would receive an embedding or an image to compare against the index
    return {"message": "Matching logic needs to be connected to the index management"}

@app.post("/analyze-hybrid")
async def analyze_hybrid(file: UploadFile = File(...), context: str = Form(None)):
    file_location = None  # Track file for cleanup
    try:
        file_location = f"{UPLOAD_DIR}/{file.filename}"
        with open(file_location, "wb+") as file_object:
            shutil.copyfileobj(file.file, file_object)
        
        # Step 1: Run YOLOv8 detection (Strict Orchestration)
        orchestration_result = engine.detect_objects(file_location)
        
        # Step 2: Run Gemini Analysis (Cloud, Enhanced, Cached)
        gemini_result = {}
        if gemini_engine.model:
            gemini_result = gemini_engine.analyze_image(file_location, context)
        
        # Step 3: Extract features (Embedding) - Already in orchestration_result if generated, but let's ensure
        # orchestration_result['features'] is the embedding list
        
        # Merge Results: Orchestration (Base) + Gemini (Override/Enhance)
        final_response = {
            "filename": file.filename,
            "message": "Hybrid analysis successful",
            **orchestration_result, # Include status, primary_category, tags, confidence, detections
            **gemini_result # Gemini overrides if available (e.g. detailed description)
        }
        
        return final_response
    except Exception as e:
        print(f"Hybrid Analysis Error: {e}")
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        # FIX: Clean up uploaded file after processing
        if file_location and os.path.exists(file_location):
            try:
                os.remove(file_location)
            except Exception as cleanup_error:
                print(f"Warning: Failed to cleanup file {file_location}: {cleanup_error}")

@app.post("/chat")
async def chat_endpoint(message: str = Form(...), context: str = Form(None)):
    try:
        response = gemini_engine.chat(message)
        return response
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

class ComparisonRequest(BaseModel):
    lost_item: Dict[str, Any]
    found_item: Dict[str, Any]

@app.post("/compare")
async def compare_items(request: ComparisonRequest):
    """
    Compare a lost item and a found item using Gemini AI.
    Returns a match confidence score and decision.
    """
    try:
        if not gemini_engine.model:
            raise HTTPException(status_code=503, detail="Gemini AI is not configured")
            
        result = gemini_engine.compare_items(request.lost_item, request.found_item)
        return result
    except Exception as e:
        print(f"Comparison Error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/reload")
async def reload_model(model_path: str = Form(...)):
    try:
        success = engine.reload_model(model_path)
        if success:
            return {"message": "Model reloaded successfully", "model_path": model_path}
        else:
            raise HTTPException(status_code=400, detail="Failed to reload model")
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    try:
        print("Starting AI Service on port 5000...")
        uvicorn.run(app, host="0.0.0.0", port=5000)
    except Exception as e:
        print(f"❌ Failed to start uvicorn: {e}")
        import traceback
        traceback.print_exc()
