const axios = require('axios');
const FormData = require('form-data');
const fs = require('fs');
const path = require('path');

async function testFullStack() {
    console.log("🚀 Testing Full Stack AI Pipeline via Backend Proxy...");
    const url = 'http://localhost:3000/api/ai/detect';

    // Use an image from ai_service if available, else make dummy
    let imagePath = path.join(__dirname, '..', 'ai_service', 'test_coco.jpg');
    if (!fs.existsSync(imagePath)) {
        console.log("⚠️ Test image not found, creating dummy...");
        imagePath = path.join(__dirname, 'test_proxy.txt');
        fs.writeFileSync(imagePath, 'dummy image content');
    }

    const form = new FormData();
    form.append('image', fs.createReadStream(imagePath));

    try {
        const response = await axios.post(url, form, {
            headers: {
                ...form.getHeaders()
            }
        });

        console.log("✅ Backend Proxy Response Status:", response.status);
        console.log("📦 Response Data Keys:", Object.keys(response.data));

        if (response.data.category) {
            console.log("✅ Category Field Present:", response.data.category);
        } else {
            console.error("❌ Category Field MISSING in proxy response!");
        }

        if (response.data.semantic_features) {
            console.log("✅ Semantic Features Present:", response.data.semantic_features);
        } else {
            console.error("❌ Semantic Features MISSING in proxy response!");
        }

    } catch (error) {
        console.error("❌ Proxy Test Failed:", error.message);
        if (error.response) {
            console.error("Response:", error.response.data);
        }
    }
}

testFullStack();
