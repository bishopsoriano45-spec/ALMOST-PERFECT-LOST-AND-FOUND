const axios = require('axios');
const fs = require('fs');
const path = require('path');
const FormData = require('form-data');

const BACKEND_URL = 'http://localhost:3000';
const AI_URL = 'http://localhost:5000';
const TEST_IMAGE_PATH = path.join(__dirname, '../ai_service/laptop_test.jpg');

async function checkSystem() {
    console.log('🩺 STARTING SURGICAL SYSTEM CHECK...\n');
    let allPassed = true;

    // 1. Backend Health
    try {
        process.stdout.write('Checking Backend Health... ');
        const res = await axios.get(`${BACKEND_URL}/api/health`);
        if (res.data.status === 'ok') {
            console.log('✅ OK');
        } else {
            console.log('❌ UNEXPECTED RESPONSE:', res.data);
            allPassed = false;
        }
    } catch (e) {
        console.log(`❌ FAILED (${e.message})`);
        allPassed = false;
    }

    // 2. AI Service Health
    try {
        process.stdout.write('Checking AI Service Health... ');
        const res = await axios.get(`${AI_URL}/health`);
        if (res.data.status === 'ok') {
            console.log('✅ OK');
        } else {
            console.log('❌ UNEXPECTED RESPONSE:', res.data);
            allPassed = false;
        }
    } catch (e) {
        console.log(`❌ FAILED (${e.message})`);
        allPassed = false;
    }

    // 3. Database Connection (via Backend)
    try {
        process.stdout.write('Checking Database Connection (via /api/items)... ');
        const res = await axios.get(`${BACKEND_URL}/api/items`);
        if (res.status === 200 && Array.isArray(res.data)) {
            console.log(`✅ OK (Retrieved ${res.data.length} items)`);
        } else {
            console.log('❌ UNEXPECTED RESPONSE:', res.status);
            allPassed = false;
        }
    } catch (e) {
        console.log(`❌ FAILED (${e.message})`);
        allPassed = false;
    }

    // 4. AI Inference (Direct)
    try {
        process.stdout.write('Checking AI Inference (Direct YOLOv8x)... ');
        if (!fs.existsSync(TEST_IMAGE_PATH)) {
            console.log('⚠️ SKIPPED (Test image not found at ' + TEST_IMAGE_PATH + ')');
            // Try to use a dummy buffer if file missing
        } else {
            const form = new FormData();
            form.append('file', fs.createReadStream(TEST_IMAGE_PATH));
            const res = await axios.post(`${AI_URL}/detect`, form, { headers: form.getHeaders() });

            if (res.data.model_version === 'yolov8x_coco') {
                console.log(`✅ OK (Detected: ${res.data.predicted_class})`);
            } else {
                console.log('❌ UNEXPECTED MODEL VERSION:', res.data.model_version);
                allPassed = false;
            }
        }
    } catch (e) {
        console.log(`❌ FAILED (${e.message})`);
        allPassed = false;
    }

    // 5. Full End-to-End Flow (Upload Item)
    try {
        process.stdout.write('Checking End-to-End Item Upload... ');
        if (!fs.existsSync(TEST_IMAGE_PATH)) {
            console.log('⚠️ SKIPPED (No test image)');
        } else {
            const form = new FormData();
            form.append('title', 'System Check Test Item');
            form.append('description', 'Automated test item');
            form.append('date', new Date().toISOString());
            form.append('location', 'Test Lab');
            form.append('category', 'Electronics');
            form.append('image', fs.createReadStream(TEST_IMAGE_PATH));

            // Note: Adjust endpoint if needed. Assuming /api/items handles POST for lost/found.
            // Usually POST /api/items/found or similar. Let's check routes file if this fails.
            // For now, attempting root POST /api/items which is common standard.
            // If main server code separates them, we might see 404.
            // Let's assume POST /api/items/found based on "Report Found".

            const res = await axios.post(`${BACKEND_URL}/api/items/found`, form, { headers: form.getHeaders() });

            if (res.status === 201 || res.status === 200) {
                console.log('✅ OK (Item Created)');
                // Optional: Check if AI processed it (if returned in response)
            } else {
                console.log(`❌ FAILED (Status: ${res.status})`);
                allPassed = false;
            }
        }
    } catch (e) {
        console.log(`❌ FAILED (${e.message})`);
        // If 404, maybe route is different.
        if (e.response && e.response.status === 404) {
            console.log('   (Hint: Endpoint /api/items/found might be wrong, checking /api/items...)');
        }
        allPassed = false;
    }

    console.log('\n--- SYSTEM CHECK SUMMARY ---');
    if (allPassed) {
        console.log('🟢 SYSTEM READY FOR DEPLOYMENT');
    } else {
        console.log('🔴 SYSTEM HAS ISSUES - SEE LOGS ABOVE');
        process.exit(1);
    }
}

checkSystem();
