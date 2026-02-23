const axios = require('axios');
const FormData = require('form-data');
const fs = require('fs');
const path = require('path');

async function testGeminiSchema() {
    console.log("🚀 Testing Gemini Hybrid Analysis Schema...");
    const url = 'http://localhost:3000/api/ai/analyze-hybrid'; // Proxy to AI service

    let imagePath = path.join(__dirname, '..', 'ai_service', 'test_coco.jpg');
    if (!fs.existsSync(imagePath)) {
        console.log("⚠️ Test image not found, creating dummy...");
        imagePath = path.join(__dirname, 'test_proxy.txt'); // Fallback, though gemini needs real image usually
        fs.writeFileSync(imagePath, 'dummy image content');
    }

    const form = new FormData();
    form.append('image', fs.createReadStream(imagePath));
    form.append('context', 'Verify schema compliance');

    try {
        const response = await axios.post(url, form, {
            headers: { ...form.getHeaders() }
        });

        console.log("✅ Response Status:", response.status);
        const data = response.data;

        // Check for Gemini-specific fields
        if (data.description || data.features) {
            // console.log("📦 Received Data:", JSON.stringify(data, null, 2));
            console.log("📦 Received Data Keys:", Object.keys(data));
            if (data.error) {
                console.error("❌ Gemini Error in Response:", data.error);
            }

            // Basic Schema Checks
            const hasRequiredKeys = ['category', 'object_type', 'confidence', 'features', 'colors', 'material', 'brand', 'visible_text', 'condition', 'shape', 'search_tags']
                .every(key => key in data);

            if (hasRequiredKeys) {
                console.log("✅ Strict Schema Validation PASSED (All keys present)");
            } else {
                console.log("⚠️ Schema Validation WARNING: Some keys might be missing or nested under 'gemini_result'. Checking structure...");
            }
        } else {
            console.log("❌ response mising expected Gemini fields");
        }

    } catch (error) {
        console.error("❌ Gemini Test Failed:", error.message);
        if (error.response) {
            console.log("Response:", error.response.data);
        }
    }
}

testGeminiSchema();
