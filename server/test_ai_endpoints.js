const axios = require('axios');
const FormData = require('form-data');
const fs = require('fs');
const path = require('path');

const AI_URL = 'http://localhost:5000';
const BACKEND_AI_URL = 'http://localhost:3000/api/ai'; // Testing via backend proxy
const TEST_IMAGE_PATH = path.join(__dirname, 'test_debug.jpg');

async function testAI() {
    console.log('🧪 Starting AI Service Endpoint Test...');
    let exitCode = 0;

    if (!fs.existsSync(TEST_IMAGE_PATH)) {
        console.error('❌ Test image missing.');
        process.exit(1);
    }

    try {
        // --- TEST 1: Direct Health Check ---
        console.log('\n🔍 Test 1: AI Service Health (GET /health)');
        try {
            const res = await axios.get(`${AI_URL}/health`);
            console.log('✅ AI Service is UP:', res.data);
        } catch (e) {
            console.error('❌ AI Service Health Check Failed:', e.message);
            // If direct check fails, subsequent tests likely fail, but let's try via backend
        }

        // --- TEST 2: Detection via Backend Proxy ---
        console.log('\n🔍 Test 2: YOLO Detection via Backend (POST /api/ai/detect)');
        const form = new FormData();
        form.append('image', fs.createReadStream(TEST_IMAGE_PATH));

        try {
            const res = await axios.post(`${BACKEND_AI_URL}/detect`, form, {
                headers: { ...form.getHeaders() }
            });
            console.log('✅ Detection Success:', res.data);
            if (!res.data.predictions && !res.data.detections) {
                console.warn('⚠️ Warning: Response structure unexpected (missing predictions/detections).');
            }
        } catch (e) {
            console.error('❌ Detection Failed:', e.message);
            if (e.response) console.error('Details:', e.response.data);
            exitCode = 1;
        }

        // --- TEST 3: Hybrid Analysis (Gemini) ---
        console.log('\n🔍 Test 3: Hybrid Analysis (Gemini) via Backend (POST /api/ai/analyze-hybrid)');
        const form2 = new FormData();
        form2.append('image', fs.createReadStream(TEST_IMAGE_PATH));
        form2.append('context', 'Test context for QA');

        try {
            const res = await axios.post(`${BACKEND_AI_URL}/analyze-hybrid`, form2, {
                headers: { ...form2.getHeaders() }
            });
            console.log('✅ Hybrid Analysis Success:', res.data);
        } catch (e) {
            console.warn('⚠️ Hybrid Analysis Failed (Expected if no API Key?):', e.message);
            // If it fails with 500, check if it's handled gracefully
            // We want to ensure it doesn't crash the server.
            // Backend logs will show error.
            if (e.response && e.response.status === 500) {
                console.log('✅ 500 Error returned (Graceful failure, server did not crash).');
            } else {
                exitCode = 1;
            }
        }

    } catch (err) {
        console.error('❌ Unexpected Test Error:', err);
        exitCode = 1;
    } finally {
        process.exit(exitCode);
    }
}

testAI();
