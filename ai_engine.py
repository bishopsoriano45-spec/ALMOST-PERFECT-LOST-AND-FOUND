import os
import sys
from typing import List, Dict, Any, Optional, Union, Tuple
import numpy as np
import numpy.typing as npt
from PIL import Image

# Type checking imports - these will be ignored at runtime if packages aren't installed
try:
    import cv2  # type: ignore
    import faiss  # type: ignore
    from ultralytics import YOLO  # type: ignore
    import torch  # type: ignore
    import torchvision.models as models  # type: ignore
    import torchvision.transforms as transforms  # type: ignore
except ImportError:
    pass

class AIEngine:
    _instance = None

    def __new__(cls):
        if cls._instance is None:
            cls._instance = super(AIEngine, cls).__new__(cls)
            cls._instance._initialized = False
        return cls._instance

    def __init__(self) -> None:
        if self._initialized:
            return
            
        self._initialized = True
        
        # Hardware detection
        self.device = "cuda" if torch.cuda.is_available() else "cpu"
        print(f"🖥️ Hardware detected: {self.device.upper()}")
        
        # COCO Relevant Classes for Lost & Found
        self.relevant_classes = {
            "cell phone", "laptop", "backpack", "bottle", "mouse", "handbag",
            "suitcase", "umbrella", "tie", "remote", "keyboard", "book", 
            "clock", "vase", "scissors", "teddy bear", "hair drier", "toothbrush",
            "cup", "fork", "knife", "spoon", "bowl", "chair", "couch", "bed", 
            "dining table", "toilet", "tv", "microwave", "oven", "toaster", "sink", 
            "refrigerator", "sports ball", "kite", "baseball bat", "baseball glove", 
            "skateboard", "surfboard", "tennis racket", "bottle"
        }

        # Mapping COCO classes to Application Categories
        self.COCO_TO_APP_CATEGORY = {
            "cell phone": "electronics", "laptop": "electronics", "mouse": "electronics", 
            "remote": "electronics", "keyboard": "electronics", "tv": "electronics", 
            "microwave": "electronics", "oven": "electronics", "toaster": "electronics",
            "refrigerator": "electronics", "clock": "accessories", "watch": "accessories",
            "umbrella": "accessories", "backpack": "bags", "handbag": "bags", 
            "suitcase": "bags", "tie": "clothing", "book": "books", "scissors": "tools", 
            "teddy bear": "toys", "hair drier": "electronics", "toothbrush": "accessories",
            "chair": "furniture", "couch": "furniture", "bed": "furniture", 
            "dining table": "furniture", "toilet": "furniture", "sink": "furniture", 
            "vase": "accessories", "cup": "accessories", "fork": "accessories",
            "knife": "accessories", "spoon": "accessories", "bowl": "accessories",
            "sports ball": "sports_equipment", "kite": "sports_equipment", 
            "baseball bat": "sports_equipment", "baseball glove": "sports_equipment", 
            "skateboard": "sports_equipment", "surfboard": "sports_equipment", 
            "tennis racket": "sports_equipment", "bottle": "accessories",
            "smartphone": "electronics", "phone": "electronics"
        }

        # Feature descriptions for categories
        self.CATEGORY_FEATURES = {
            "electronics": ["Screen", "Buttons", "Ports", "Metallic/Plastic Finish", "Power Indicator"],
            "clothing": ["Fabric Texture", "Stitching", "Buttons/Zippers", "Pattern", "Label"],
            "accessories": ["Small Size", "Decorative", "Functional", "Material Texture"],
            "bags": ["Straps/Handles", "Zippers", "Compartments", "Fabric/Leather"],
            "books": ["Paper Pages", "Cover", "Text", "Binding", "Rectangular"],
            "tools": ["Handle", "Metal Parts", "Functional Shape", "Grip"],
            "toys": ["Colorful", "Soft/Plastic", "Playful Shape", "Child-safe"],
            "furniture": ["Large Size", "Stable Base", "Upholstery/Wood", "Functional"],
            "sports_equipment": ["Durable Material", "Sport Specific Shape", "Grip/Handle"],
            "unknown": ["visual pattern", "object shape", "color texture"]
        }

        # Try loading custom model first
        models_dir = os.path.join(os.path.dirname(__file__), 'models')
        custom_model_path = os.path.join(models_dir, 'unified_best.pt')
        
        self.custom_detector = None
        if os.path.exists(custom_model_path):
            print(f"Loading Custom Model: {custom_model_path}")
            try:
                self.custom_detector = YOLO(custom_model_path)
                if self.device == "cuda":
                    self.custom_detector.to("cuda")
                    self.custom_detector.model.half()
                print("✅ Custom YOLOv8 model loaded successfully")
            except Exception as e:
                print(f"❌ Error loading custom model: {e}")
                self.custom_detector = None
        
        # Always load COCO model for hybrid detection
        print(f"Loading COCO YOLOv8x model (Plug-and-Play)...")
        self.coco_detector = None
        coco_model_path = os.path.join(os.path.dirname(__file__), 'yolov8x.pt')
        try:
            self.coco_detector = YOLO(coco_model_path)
            if self.device == "cuda":
                self.coco_detector.to("cuda")
                self.coco_detector.model.half()
            print("✅ YOLOv8x COCO model loaded on startup")
        except Exception as e:
            print(f"❌ Error loading yolov8x.pt: {e}")
            self.coco_detector = None

        self.using_custom_model = self.custom_detector is not None

        print("Loading Feature Extraction model (ResNet50)...")
        # Load ResNet50 for embeddings
        resnet_model: Any = models.resnet50(weights=models.ResNet50_Weights.IMAGENET1K_V1)
        resnet_model.eval()
        children_list = list(resnet_model.children())
        self.extractor: Any = torch.nn.Sequential(*children_list[:-1])
        
        if self.device == "cuda":
            self.extractor.to("cuda")
        
        self.transform: Any = transforms.Compose([
            transforms.Resize(256),
            transforms.CenterCrop(224),
            transforms.ToTensor(),
            transforms.Normalize(mean=[0.485, 0.456, 0.406], std=[0.229, 0.224, 0.225]),
        ])
        
        self.dimension: int = 2048
        self.index: Any = faiss.IndexFlatL2(self.dimension)
        self.image_paths: List[str] = []

    def detect_objects(self, image_path: str) -> Dict[str, Any]:
        """
        Orchestrate the detection process with SEMANTIC INTEGRITY logic.
        """
        all_detections = []
        
        # Thresholds from requirements
        CUSTOM_CONF = 0.55
        COCO_CONF = 0.65

        print(f"🔍 [Integrity Engine] Processing {os.path.basename(image_path)}")

        # 1. Run Custom Model
        if self.custom_detector:
            custom_dets = self._run_inference(self.custom_detector, image_path, conf=CUSTOM_CONF, source="custom")
            all_detections.extend(custom_dets)
        
        # 2. Run COCO Model
        if self.coco_detector:
             coco_dets = self._run_inference(self.coco_detector, image_path, conf=COCO_CONF, source="coco")
             all_detections.extend(coco_dets)

        # 3. Merge Detections (Priority Logic)
        merged_detections = self._merge_detections(all_detections)
        
        # --- integrity Logic Starts Here ---
        
        # Step 5: Smart Phone Override (Run before validation to save missed phones)
        self._smart_phone_override(image_path, merged_detections)

        # Step 1: Validate Raw Detections
        if not merged_detections:
            return {
                "status": "LOW_CONFIDENCE",
                "primary_category": None,
                "secondary_tags": [],
                "confidence": 0.0,
                "features": [],
                "feature_status": "NO_FEATURES_DETECTED",
                "needs_user_confirmation": True,
                "allow_manual_override": True,
                "detections": [],
                "embedding_generated": False,
                "matching_candidates": []
            }

        # Step 2 & 4: Category Enforcement & Confidence Correction
        final_detections = []
        primary_category = None
        needs_user_confirmation = False
        
        # Sort to find primary
        merged_detections.sort(key=lambda x: x['confidence'], reverse=True)
        top_det = merged_detections[0]
        
        # Enforce Category (Step 2: "Other" Protection)
        category_result = self._enforce_category(top_det['predicted_class'], top_det['confidence'])
        primary_category = category_result['category'] 
        if not primary_category: primary_category = "unknown" # Safety
        
        if category_result['needs_confirmation']:
            needs_user_confirmation = True
        
        # Correct Confidence (Step 5: Normalization)
        final_conf = self._correct_confidence(top_det['confidence'], top_det['model_source'], primary_category)
        if category_result.get('cap_confidence'):
             final_conf = min(final_conf, category_result['cap_confidence'])
        
        # Step 3: Feature Extraction (Prevent Undefined)
        embedding = self.extract_features(image_path)
        feature_status = "FEATURES_DETECTED" if len(embedding) > 0 else "NO_FEATURES_DETECTED"
        
        # Generate Tags
        tags = list(set([d['predicted_class'] for d in merged_detections]))[:5]

        # Step 6: Final Output Structure
        result = {
            "status": "SUCCESS",
            "primary_category": primary_category,
            "secondary_tags": tags,
            "confidence": final_conf,
            "features": embedding.tolist(), # Embedding vector
            "feature_status": feature_status,
            "needs_user_confirmation": needs_user_confirmation,
            "allow_manual_override": True,
            "detections": merged_detections,
            "matching_candidates": [] 
        }
        
        # FINAL STEP: Strict JSON Validation
        return self._validate_final_output(result)

    def _validate_final_output(self, result: Dict[str, Any]) -> Dict[str, Any]:
        """
        Strict JSON Validation & Sanitization.
        Ensures NO undefined/null values, correct types, and required keys.
        """
        safe_result: Dict[str, Any] = {
            "status": "LOW_CONFIDENCE",
            "primary_category": "unknown",
            "secondary_tags": [],
            "detections": [],
            "confidence": 0.0,
            "embedding_generated": False,
            "needs_user_confirmation": True
        }

        try:
            # 1. Status
            status = result.get("status")
            if status not in ["SUCCESS", "LOW_CONFIDENCE"]:
                safe_result["status"] = "LOW_CONFIDENCE"
            else:
                safe_result["status"] = status

            # 2. Primary Category (String, No Nulls)
            cat = result.get("primary_category")
            if not isinstance(cat, str) or not cat:
                safe_result["primary_category"] = "unknown"
                safe_result["needs_user_confirmation"] = True
            else:
                safe_result["primary_category"] = cat

            # 3. Secondary Tags (Array of Strings)
            tags = result.get("secondary_tags")
            if not isinstance(tags, list):
                safe_result["secondary_tags"] = []
            else:
                # Filter non-string tags
                safe_result["secondary_tags"] = [str(t) for t in tags if t]

            # 4. Confidence (Float 0.0-1.0)
            conf = result.get("confidence")
            try:
                conf_val = float(conf)
                if 0.0 <= conf_val <= 1.0:
                    safe_result["confidence"] = conf_val
                else:
                    safe_result["confidence"] = 0.0
            except (TypeError, ValueError):
                 safe_result["confidence"] = 0.0

            # 5. Embedding Generated (Boolean)
            safe_result["embedding_generated"] = bool(result.get("embedding_generated", False))
            
            # 6. Needs User Confirmation (Boolean)
            safe_result["needs_user_confirmation"] = bool(result.get("needs_user_confirmation", True))

            # 7. Detections (Array of Objects)
            raw_dets = result.get("detections")
            safe_dets = []
            if isinstance(raw_dets, list):
                for d in raw_dets:
                    if not isinstance(d, dict): continue
                    
                    # Label Sanitization
                    lbl = d.get("predicted_class") or d.get("label")
                    if not isinstance(lbl, str) or not lbl:
                        lbl = "unknown"
                    
                    # Confidence Sanitization
                    d_conf = 0.0
                    try:
                        val = d.get("confidence")
                        if val is None:
                            d_conf = 0.0
                        else:
                            d_conf = float(val)
                            
                        if not (0.0 <= d_conf <= 1.0): d_conf = 0.0
                    except: d_conf = 0.0
                    
                    # Source Sanitization
                    src = d.get("model_source", "unknown")
                    if str(src) not in ["custom", "coco"]: src = "unknown"

                    safe_dets.append({
                        "label": lbl,
                        "confidence": d_conf,
                        "source": str(src)
                        # Omit bbox for frontend safety if not needed, or validate it too
                    })
            
            safe_result["detections"] = safe_dets
            
            # Forward embedding vector if it check out (internal use)
            ft = result.get("features")
            if isinstance(ft, list):
                 safe_result["features"] = ft
            else:
                 safe_result["features"] = []

        except Exception as e:
            print(f"❌ JSON Validation Error: {e}")
            # Fallback is already set in safe_result
            
        return safe_result

    def _enforce_category(self, label: str, confidence: float) -> Dict[str, Any]:
        """
        Step 2: Category Enforcement & "OTHER" Protection
        """
        category = self.COCO_TO_APP_CATEGORY.get(label)
        
        # Rule: Category may only be "Other" (None/unknown here) if...
        if not category:
             # If high confidence but unknown category -> Force confirm, cap confidence
             if confidence > 0.85:
                 return {"category": "other", "needs_confirmation": True, "cap_confidence": 0.75}
             
             # If low confidence -> "other" is allowed but weak
             if confidence < 0.80:
                  return {"category": "other", "needs_confirmation": True}
             
             return {"category": "other", "needs_confirmation": True}

        # Normal category logic
        if confidence < 0.60:
             return {"category": category, "needs_confirmation": True}
             
        return {"category": category, "needs_confirmation": False}

    def _correct_confidence(self, raw_conf: float, source: str, category: str) -> float:
        """
        Step 5: Confidence Normalization
        semantic_clarity_score logic
        """
        clarity_score = 1.0
        
        if source == "custom":
             clarity_score = 1.0
        elif source == "coco":
             clarity_score = 0.75
        
        if category == "other" or category == "unknown":
             clarity_score = min(clarity_score, 0.6) # Weak detection
             
        return round(raw_conf * clarity_score, 2)

    def _smart_phone_override(self, image_path: str, detections: List[Dict[str, Any]]) -> None:
        """
        Step 5: Smart Phone Specific Override
        Checks for rectangular shapes/screen ratios if no strong phone detection exists.
        """
        # Check if phone already detected
        for d in detections:
            if d['predicted_class'] in ["cell_phone", "phone", "smartphone"]:
                return
        
        try:
             # Basic heuristic: Aspect ratio check using PIL
             with Image.open(image_path) as img:
                 w, h = img.size
                 ratio = w/h if w > h else h/w
                 # Classic phone ratios ~16:9 (1.77) to 20:9 (2.2)
                 if 1.5 < ratio < 2.5:
                     # It's a candidate. If we have NO detections, let's suggest it.
                     if not detections:
                         detections.append({
                             "predicted_class": "smartphone",
                             "raw_class": "smartphone (heuristic)",
                             "confidence": 0.60, # Moderate confidence
                             "bbox": [0, 0, w, h],
                             "model_source": "heuristic",
                             "is_relevant": True
                         })
                         print("📱 Smart Phone Override Applied")
        except Exception:
            pass


    def _merge_detections(self, detections: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        """
        Strict Priority Merge:
        - Custom > COCO
        - Higher Confidence > Lower Confidence (if same source)
        - IoU > 0.6 -> Duplicate
        """
        if not detections:
            return []
            
        # Sort by confidence (descending)
        detections.sort(key=lambda x: x['confidence'], reverse=True)
        
        kept_detections = []
        
        while detections:
            current = detections.pop(0)
            keep_current = True
            
            for kept in kept_detections:
                iou = self.calculate_iou(current['bbox'], kept['bbox'])
                if iou > 0.6:
                    # Overlap found!
                    # Custom Priority Rule:
                    # If current is CUSTOM and kept is COCO -> Replace kept
                    if current['model_source'] == 'custom' and kept['model_source'] == 'coco':
                        kept_detections.remove(kept)
                        kept_detections.append(current)
                        keep_current = False
                        break
                    # If current is COCO and kept is CUSTOM -> Drop current
                    elif current['model_source'] == 'coco' and kept['model_source'] == 'custom':
                        keep_current = False
                        break
                    # Same source -> Keep higher confidence (which is 'kept' because we sorted)
                    else:
                        keep_current = False
                        break
            
            if keep_current:
                kept_detections.append(current)
                
        return kept_detections

    def _run_inference(self, model, image_path, conf, iou=0.7, imgsz=640, source="coco") -> List[Dict[str, Any]]:
        valid_detections = []
        
        # Ignored Vague Labels
        IGNORED_LABELS = {"object", "item", "thing", "indoor", "accessory", "electronics"} 
        
        try:
            results = model(image_path, conf=conf, iou=iou, imgsz=imgsz, device=self.device, verbose=False)
            
            for result in results:
                for box in result.boxes:
                    class_id = int(box.cls)
                    raw_name = result.names[class_id]
                    confidence = float(box.conf)
                    coords_list = box.xyxy.tolist()[0] 
                    
                    normalized_name = raw_name.lower().strip().replace(" ", "_")
                    
                    # Vague Label Filter
                    if normalized_name in IGNORED_LABELS:
                        continue

                    # COCO class relevance filter
                    is_relevant = True
                    if source == "coco":
                        is_relevant = (raw_name.lower() in self.relevant_classes) or \
                                      (raw_name in self.relevant_classes)
                    
                    if is_relevant:
                        det = {
                            "predicted_class": normalized_name,
                            "raw_class": raw_name,
                            "confidence": confidence,
                            "bbox": coords_list,
                            "model_source": source,
                            "is_relevant": True
                        }
                        valid_detections.append(det)
                        # print(f"   [{source.upper()}] Found: {raw_name} ({confidence:.2f})")
            
            return valid_detections

        except Exception as e:
            print(f"❌ Inference Error ({source}): {e}")
            return []

    def get_best_prediction(self, detections: List[Dict[str, Any]]) -> Tuple[str, float]:
        """
        Get the top prediction and confidence.
        """
        if not detections:
            return "unknown", 0.0
            
        # Sort by confidence
        best_det = max(detections, key=lambda x: x['confidence'])
        return best_det['class'], best_det['confidence']

    def calculate_iou(self, box1, box2):
        """
        Calculate Intersection over Union (IoU) of two bounding boxes.
        Box format: [x1, y1, x2, y2]
        """
        x1 = max(box1[0], box2[0])
        y1 = max(box1[1], box2[1])
        x2 = min(box1[2], box2[2])
        y2 = min(box1[3], box2[3])
        
        intersection_area = max(0, x2 - x1) * max(0, y2 - y1)
        
        box1_area = (box1[2] - box1[0]) * (box1[3] - box1[1])
        box2_area = (box2[2] - box2[0]) * (box2[3] - box2[1])
        
        union_area = box1_area + box2_area - intersection_area
        
        if union_area == 0:
            return 0
            
        return intersection_area / union_area

    def _extract_features_safe(self, image_path: str, detections: List[Dict[str, Any]], confidence: float) -> Any:
        """
        Step 3: Embedding Generation Guard
        Generate ONLY IF:
        - Primary detection exists
        - confidence >= 0.60
        """
        if not detections:
            return np.array([])
            
        if confidence < 0.60:
             return np.array([])

        return self.extract_features(image_path)

    def extract_features(self, image_path: str) -> npt.NDArray[np.float32]:
        try:
            img: Image.Image = Image.open(image_path).convert('RGB')
            img_t: Any = self.transform(img)
            batch_t: Any = torch.unsqueeze(img_t, 0)
            
            if self.device == "cuda":
                batch_t = batch_t.to("cuda")
            
            with torch.no_grad():
                embedding: Any = self.extractor(batch_t)
            
            # Flatten and normalize
            embedding_np: npt.NDArray[Any] = embedding.cpu().numpy().flatten()
            
            # Ensure shape consistency (ResNet50 should be 2048)
            expected_dim = 2048
            if embedding_np.shape[0] != expected_dim:
                print(f"⚠️ Warning: Embedding shape mismatch {embedding_np.shape}, fixing...")
                if embedding_np.shape[0] > expected_dim:
                     embedding_np = embedding_np[:expected_dim]
                else:
                     embedding_np = np.pad(embedding_np, (0, expected_dim - embedding_np.shape[0]))

            norm: float = float(np.linalg.norm(embedding_np))
            if norm > 0:
                embedding_np = embedding_np / norm
            
            return embedding_np.astype(np.float32)
        except Exception as e:
            print(f"❌ Feature Extraction Error: {e}")
            return np.zeros(2048, dtype=np.float32)

    def add_to_index(self, image_path: str, embedding: npt.NDArray[np.float32]) -> None:
        self.index.add(np.array([embedding], dtype=np.float32))
        self.image_paths.append(image_path)

    def search(self, query_embedding: npt.NDArray[np.float32], k: int = 5) -> List[Dict[str, Union[str, float]]]:
        D: Any
        I: Any
        D, I = self.index.search(np.array([query_embedding], dtype=np.float32), k)
        results: List[Dict[str, Union[str, float]]] = []
        for i, idx in enumerate(I[0]):
            if idx != -1 and idx < len(self.image_paths):
                results.append({
                    "image_path": self.image_paths[idx],
                    "score": float(D[0][i])
                })
        return results

    def match_candidates(self, target_embedding: List[float], target_category: str, target_tags: List[str], candidates: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        """
        Execute Strict Matching Logic:
        1. Filter by Primary Category (Must Match)
        2. Filter by At Least 1 Shared Tag
        3. Calculate Cosine Similarity
        4. Apply Score Thresholds (0.85/0.75/0.70)
        """
        matches = []
        target_vec = np.array(target_embedding)
        norm = np.linalg.norm(target_vec)
        if norm > 0:
            target_vec = target_vec / norm

        for cand in candidates:
            # 1. Category Filter
            if cand.get('primary_category') != target_category:
                continue
            
            # 2. Tag Filter (At least 1 shared)
            cand_tags = set(cand.get('secondary_tags', []))
            shared_tags = set(target_tags).intersection(cand_tags)
            if not shared_tags:
                continue
                
            # 3. Cosine Similarity
            cand_vec = np.array(cand.get('embedding_vector', []))
            cand_norm = np.linalg.norm(cand_vec)
            if cand_norm > 0:
                cand_vec = cand_vec / cand_norm
                
            similarity = float(np.dot(target_vec, cand_vec))
            
            # 4. Threshold Logic
            match_level = "IGNORE"
            if similarity >= 0.85:
                match_level = "HIGH"
            elif 0.75 <= similarity < 0.85:
                match_level = "REVIEW"
            elif 0.70 <= similarity < 0.75:
                match_level = "POSSIBLE"
            
            if match_level != "IGNORE":
                matches.append({
                    "item_id": cand.get('item_id'),
                    "similarity_score": round(similarity, 4),
                    "match_level": match_level
                })
        
        # Sort by score
        matches.sort(key=lambda x: x['similarity_score'], reverse=True)
        return matches

    def match_candidates(self, target_embedding: List[float], target_category: str, target_tags: List[str], candidates: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        """
        Execute Strict Matching Logic:
        1. Filter by Primary Category (Must Match)
        2. Filter by At Least 1 Shared Tag
        3. Calculate Cosine Similarity
        4. Apply Score Thresholds (0.85/0.75/0.70)
        """
        matches = []
        target_vec = np.array(target_embedding)
        norm = np.linalg.norm(target_vec)
        if norm > 0:
            target_vec = target_vec / norm

        for cand in candidates:
            # 1. Category Filter
            if cand.get('primary_category') != target_category:
                continue
            
            # 2. Tag Filter (At least 1 shared)
            cand_tags = set(cand.get('secondary_tags', []))
            shared_tags = set(target_tags).intersection(cand_tags)
            if not shared_tags:
                continue
                
            # 3. Cosine Similarity
            cand_vec = np.array(cand.get('embedding_vector', []))
            cand_norm = np.linalg.norm(cand_vec)
            if cand_norm > 0:
                cand_vec = cand_vec / cand_norm
                
            similarity = float(np.dot(target_vec, cand_vec))
            
            # 4. Threshold Logic
            match_level = "IGNORE"
            if similarity >= 0.85:
                match_level = "HIGH"
            elif 0.75 <= similarity < 0.85:
                match_level = "REVIEW"
            elif 0.70 <= similarity < 0.75:
                match_level = "POSSIBLE"
            
            if match_level != "IGNORE":
                matches.append({
                    "item_id": cand.get('item_id'),
                    "similarity_score": round(similarity, 4),
                    "match_level": match_level
                })
        
        # Sort by score
        matches.sort(key=lambda x: x['similarity_score'], reverse=True)
        return matches

    def reload_model(self, model_path: str) -> bool:
        """
        Hot-reload the custom YOLO model.
        """
        print(f"🔄 Reloading model from {model_path}...")
        try:
            if not os.path.exists(model_path):
                print(f"❌ Model file not found: {model_path}")
                return False
                
            new_model = YOLO(model_path)
            if self.device == "cuda":
                new_model.to("cuda")
                new_model.model.half()
                
            # atomic swap
            self.custom_detector = new_model
            self.using_custom_model = True
            print(f"✅ Model reloaded successfully: {model_path}")
            return True
        except Exception as e:
            print(f"❌ Failed to reload model: {e}")
            return False

# Singleton instance
ai_engine = AIEngine()
