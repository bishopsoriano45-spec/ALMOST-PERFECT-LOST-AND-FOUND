import os
import time
import hashlib
import json
import google.genai as genai
from PIL import Image
from typing import Dict, Any, Optional, List
from dotenv import load_dotenv

# Load environment variables
load_dotenv(os.path.join(os.path.dirname(__file__), '.env'))

class GeminiHandler:
    def __init__(self):
        self.api_key = os.getenv("GEMINI_API_KEY")
        self.client = None
        self.model = None
        self.cache_file = os.path.join(os.path.dirname(__file__), 'gemini_cache.json')
        self.cache: Dict[str, Any] = self._load_cache()
        self.last_call_time: float = 0.0
        self.min_interval = 2.0  # Minimum seconds between API calls (rate limiting)
        
        if self.api_key and self.api_key != "YOUR_API_KEY_HERE":
            try:
                self.client = genai.Client(api_key=self.api_key)
                self.model = 'gemini-2.0-flash'
                print("Gemini 2.0 Flash model loaded successfully.")
            except Exception as e:
                print(f"Failed to initialize Gemini: {e}")
        else:
            print("WARNING: GEMINI_API_KEY not found or invalid in .env file.")

    def _load_cache(self) -> Dict[str, Any]:
        if os.path.exists(self.cache_file):
            try:
                with open(self.cache_file, 'r') as f:
                    return json.load(f)
            except Exception as e:
                print(f"Error loading cache: {e}")
        return {}

    def _save_cache(self):
        try:
            with open(self.cache_file, 'w') as f:
                json.dump(self.cache, f, indent=2)
        except Exception as e:
            print(f"Error saving cache: {e}")

    def _compute_image_hash(self, image_path: str) -> str:
        """Compute a SHA256 hash of the image file."""
        with open(image_path, "rb") as f:
            file_hash = hashlib.sha256()
            while chunk := f.read(8192):
                file_hash.update(chunk)
        return file_hash.hexdigest()

    def _wait_for_rate_limit(self):
        """Ensure we don't exceed rate limits."""
        elapsed = time.time() - self.last_call_time
        if elapsed < self.min_interval:
            time.sleep(self.min_interval - elapsed)
        self.last_call_time = time.time()

    def analyze_image(self, image_path: str, context: str = "") -> Dict[str, Any]:
        """
        Analyze an image using Gemini 1.5 Flash.
        Returns a dictionary with description and features.
        """
        if not self.model:
            return {"error": "Gemini API key not configured"}

        # Check cache first
        image_hash = self._compute_image_hash(image_path)
        if image_hash in self.cache:
            print("Gemini Cache Hit! Returning cached result.")
            return self.cache[image_hash]



        print("Gemini Cache Miss. Calling API...")
        self._wait_for_rate_limit()

        try:
            img = Image.open(image_path)
            
            prompt = """
            You are an AI module inside a production Lost-and-Found system.
            Your role is to RETURN CLEAN, VALIDATED DATA THAT MATCHES THE APPLICATION SCHEMA.

            You are NOT allowed to invent fields.
            You are NOT allowed to rename fields.
            You are NOT allowed to return null, undefined, or missing keys.

            Your output feeds directly into an automated matching engine and UI.
            If you break schema, the system fails. Therefore strict compliance is required.

            ---

            ## YOU MUST RETURN EXACTLY THIS JSON STRUCTURE:

            {
            "category": "string",
            "object_type": "string",
            "confidence": number,
            "features": ["string"],
            "colors": ["string"],
            "material": "string",
            "brand": "string",
            "visible_text": ["string"],
            "condition": "string",
            "shape": "string",
            "search_tags": ["string"]
            }

            ---

            ## FIELD RULES (MANDATORY)

            1. NEVER return null.

            2. NEVER return undefined.

            3. If unknown -> return "unknown" (string) or [] (array).

            4. Arrays must always exist even if empty.

            5. confidence must be a number between 0.0 and 1.0.

            6. category must be one of:
               ["electronics","bag","accessory","document","clothing","container","other"]

            7. features must describe DISTINCTIVE MATCHABLE TRAITS only.
               Examples:
               ✔ "orange protective case"
               ✔ "cracked top-right corner"
               ✔ "dual rear cameras"
               ✘ "modern design"
               ✘ "valuable item"

            8. search_tags must contain concise keywords useful for similarity search.
               Example:
               ["smartphone","orange case","black screen","touchscreen"]

            9. Do NOT include explanations, notes, markdown, or extra keys.

            ---

            ## IDENTIFICATION LOGIC

            Use only visible evidence from the image.

            If the object is clearly a phone:
            category = "electronics"
            object_type = "smartphone"

            If it cannot be confidently mapped:
            category = "other"
            object_type = "unknown"

            Do NOT guess brands.
            Only include a brand if text/logo is clearly readable.

            ---

            ## DATA SANITIZATION STEP (CRITICAL)

            Before returning the response, you MUST internally validate:

            ✓ All required keys exist
            ✓ No field is null
            ✓ No field name differs from schema
            ✓ All arrays contain only strings
            ✓ Output is valid JSON

            If validation would fail, correct the values automatically.
            Never return broken data.

            ---

            ## EXAMPLE OF A VALID RESPONSE

            {
            "category": "electronics",
            "object_type": "smartphone",
            "confidence": 0.94,
            "features": ["orange protective case","black front screen","single front camera notch"],
            "colors": ["black","orange"],
            "material": "glass and plastic",
            "brand": "unknown",
            "visible_text": [],
            "condition": "used",
            "shape": "rectangular",
            "search_tags": ["phone","smartphone","orange case","black screen"]
            }

            ---

            ## FAILSAFE (WHEN IMAGE IS UNCLEAR)

            Return safe defaults instead of failing:

            {
            "category": "other",
            "object_type": "unknown",
            "confidence": 0.0,
            "features": [],
            "colors": [],
            "material": "unknown",
            "brand": "unknown",
            "visible_text": [],
            "condition": "unknown",
            "shape": "unknown",
            "search_tags": []
            }

            ---

            REMEMBER:
            You are a STRUCTURED DATA GENERATOR, not a chatbot.
            Your success is measured by schema correctness and match usefulness.
            --------------------------------------------------------------------
            """
            
            if context:
                prompt += f"\nAdditional Context: {context}"

            response = self.client.models.generate_content(
                model=self.model,
                contents=[prompt, img]
            )
            
            # Parse JSON from response
            text_response = response.text.strip()
            # Remove ```json and ``` if present
            if text_response.startswith("```json"):
                text_response = text_response[7:]
            if text_response.endswith("```"):
                text_response = text_response[:-3]
            
            result = json.loads(text_response.strip())
            
            # Cache the successful result
            self.cache[image_hash] = result
            self._save_cache()
            
            return result
            
        except Exception as e:
            print(f"Gemini Analysis Error: {e}")
            return {"error": str(e), "description": "Analysis failed due to an error."}

    def chat(self, message: str, context: List[Dict[str, str]] = []) -> Dict[str, Any]:
        """
        Chat with Gemini about lost items.
        Returns a dict with 'response', 'suggestions', and optional 'extracted_info'.
        """
        if not self.model:
            return {
                "response": "I'm sorry, my advanced brain isn't connected right now. Please tell the admin to check the Gemini API key.",
                "suggestions": []
            }

        self._wait_for_rate_limit()
        
        try:
            # Construct a prompt with context
            system_prompt = """
            You are a helpful assistant for a 'Lost and Found' service. 
            Your goal is to help users report lost items or find matches.
            
            OUTPUT FORMAT:
            You must return a JSON object with the following structure:
            {
                "response": "Your conversational response here. Be empathetic and helpful.",
                "suggestions": ["Short suggestion 1", "Short suggestion 2", "Maximum 4 suggestions"],
                "extracted_info": {
                    "category": "One of: Electronics, Personal Accessories, Clothing, Documents, Academic, Other",
                    "description": "Any extracted details about the item",
                    "location": "Any extracted location"
                }
            }
            
            GUIDELINES:
            - If the user just says "hi", suggest "Report lost item" or "Report found item".
            - If the user says "I lost my phone", suggest details like "iPhone", "Samsung", "Black case".
            - If the user provides details, try to extract them into 'extracted_info'.
            - Keep suggestions short (under 20 chars if possible).
            - Do not use markdown code blocks, just return the raw JSON.
            """
            
            full_prompt = f"{system_prompt}\n\nUser: {message}"
            
            response = self.client.models.generate_content(
                model=self.model,
                contents=full_prompt
            )
            text_response = response.text.strip()
            
            # Clean up markdown if present
            if text_response.startswith("```json"):
                text_response = text_response[7:]
            if text_response.endswith("```"):
                text_response = text_response[:-3]
                
            try:
                result = json.loads(text_response.strip())
                return result
            except json.JSONDecodeError:
                # Fallback if model fails to return JSON
                print(f"Gemini failed to return JSON: {text_response}")
                return {
                    "response": text_response,
                    "suggestions": [],
                    "extracted_info": {}
                }
            
        except Exception as e:
            print(f"Gemini Chat Error: {e}")
            return {
                "response": "I'm having trouble thinking right now. Please try again later.",
                "suggestions": []
            }

    def compare_items(self, lost_item: Dict[str, Any], found_item: Dict[str, Any]) -> Dict[str, Any]:
        """
        Compare a lost item and a found item to determine if they match.
        Uses strict AI evaluation based on user-defined rules.
        """
        if not self.model:
            return {"error": "Gemini API key not configured"}



        self._wait_for_rate_limit()
        
        try:
            prompt = """
            You are an automated matching evaluator inside the "Almost Perfect Lost & Found" system.

            Your task is to determine whether two item reports (one LOST and one FOUND) refer to the SAME physical object and whether the system should notify the owner.

            You must behave like a strict comparison engine.
            Do NOT explain reasoning.
            Return ONLY the required JSON output.

            ---

            ## INPUT

            You will receive two structured objects:

            1. LOST ITEM DATA
            2. FOUND ITEM DATA

            Each contains:

            * category
            * object_type
            * colors
            * features
            * material
            * brand
            * visible_text
            * condition
            * location
            * date
            * search_tags

            ---

            ## MATCHING RULES (STRICT)

            You must score similarity using these weighted factors:

            1. Object Type Match (REQUIRED)
               If object_type is different -> NOT A MATCH.

            2. Visual Features Overlap (40%)
               Compare distinctive features like:

               * case color
               * scratches
               * stickers
               * damage
               * shape details

            3. Color Similarity (15%)
               Major colors must align.

            4. Text Match (20%)
               Any shared visible text is STRONG evidence.

            5. Brand Match (10%)
               Only if explicitly known (ignore if "unknown").

            6. Location Proximity (10%)
               Same or nearby location increases likelihood.

            7. Time Difference (5%)
               Items reported within a reasonable timeframe (<=30 days).

            ---

            ## DECISION THRESHOLD

            Compute an internal confidence score from 0.0-1.0.

            If confidence >= 0.70 -> SHOULD NOTIFY OWNER.
            If confidence < 0.70 -> DO NOT NOTIFY.

            You must be conservative.
            False positives are worse than missed matches.

            ---

            ## OUTPUT FORMAT (MANDATORY)

            {
            "match_confidence": number,
            "should_notify": true/false,
            "match_summary": "short factual reason",
            "matched_attributes": ["list of attributes that aligned"],
            "mismatched_attributes": ["list of attributes that differed"]
            }

            ---

            ## OUTPUT RULES

            * Output must always be valid JSON.
            * Never return null values.
            * Never include explanations outside the JSON.
            * match_summary must be one short sentence describing the strongest evidence.
            * If object types differ, confidence must be <= 0.30.

            ---

            ## FAILSAFE

            If data is insufficient to compare, return:

            {
            "match_confidence": 0.0,
            "should_notify": false,
            "match_summary": "Insufficient data for comparison.",
            "matched_attributes": [],
            "mismatched_attributes": []
            }

            ---

            ## IMPORTANT

            You are making a SYSTEM DECISION, not a suggestion.

            Your output directly determines whether an automated email notification is sent to a user.

            ## Be strict. Only approve when evidence strongly supports a match.
            """
            
            input_data = f"LOST ITEM DATA:\n{json.dumps(lost_item, indent=2)}\n\nFOUND ITEM DATA:\n{json.dumps(found_item, indent=2)}"
            full_prompt = f"{prompt}\n\n{input_data}"
            
            response = self.client.models.generate_content(
                model=self.model,
                contents=full_prompt
            )
            text_response = response.text.strip()
            
            # Clean up markdown
            if text_response.startswith("```json"):
                text_response = text_response[7:]
            if text_response.endswith("```"):
                text_response = text_response[:-3]
                
            return json.loads(text_response.strip())
            
        except Exception as e:
            print(f"Gemini Matching Error: {e}")
            return {
                "match_confidence": 0.0,
                "should_notify": False,
                "match_summary": f"Error during comparison: {str(e)}",
                "matched_attributes": [],
                "mismatched_attributes": []
            }

# Singleton instance
gemini_engine = GeminiHandler()
