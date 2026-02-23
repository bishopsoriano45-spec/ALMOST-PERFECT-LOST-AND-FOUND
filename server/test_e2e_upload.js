const axios = require('axios');
const FormData = require('form-data');
const fs = require('fs');
const path = require('path');
const { pool } = require('./db/db');

const BASE_URL = 'http://localhost:3000/api'; // Backend URL
const TEST_IMAGE_PATH = path.join(__dirname, 'test_debug.jpg');

async function testE2EUpload() {
    console.log('🧪 Starting E2E Upload & Persistence Test...');
    let exitCode = 0;

    // Ensure test image exists
    if (!fs.existsSync(TEST_IMAGE_PATH)) {
        console.error('❌ Test image not found at:', TEST_IMAGE_PATH);
        // Create a dummy file if needed
        fs.writeFileSync(TEST_IMAGE_PATH, 'dummy content');
        console.log('⚠️ Created dummy test image.');
    }

    try {
        // --- TEST CASE 1: Happy Path (AI Service "worked") ---
        console.log('\n📝 Test Case 1: Upload with valid AI Metadata (Simulating Frontend Success)');
        const form1 = new FormData();
        form1.append('title', 'QA Test Item - Happy Path');
        form1.append('description', 'Testing upload with AI metadata');
        form1.append('category', 'electronics');
        form1.append('location', 'Test Lab');
        form1.append('date_lost', new Date().toISOString());
        form1.append('user_id', 'guest');
        form1.append('contact_email', 'guest@example.com');
        form1.append('ai_metadata', JSON.stringify({ category: 'electronics', confidence: 0.95 }));
        form1.append('image', fs.createReadStream(TEST_IMAGE_PATH));

        const res1 = await axios.post(`${BASE_URL}/items/lost`, form1, {
            headers: { ...form1.getHeaders() }
        });

        if (res1.status === 201 && res1.data.id) {
            console.log(`✅ Success: Item created with ID ${res1.data.id}`);

            // Verify DB Persistence
            const dbCheck1 = await pool.query("SELECT * FROM lost_items WHERE title = 'QA Test Item - Happy Path' ORDER BY created_at DESC LIMIT 1");
            if (dbCheck1.rows.length > 0 && dbCheck1.rows[0].detection_label === 'electronics') {
                console.log('✅ DB Verification Passed: Record exists and has AI metadata.');
            } else {
                console.error('❌ DB Verification Failed: Record missing or metadata incorrect.');
                exitCode = 1;
            }
        } else {
            console.error('❌ Upload Failed:', res1.status, res1.data);
            exitCode = 1;
        }

        // --- TEST CASE 2: Resilience (AI Service "failed") ---
        console.log('\n📝 Test Case 2: Upload WITHOUT AI Metadata (Simulating AI Failure / Manual Entry)');
        const form2 = new FormData();
        form2.append('title', 'QA Test Item - Fallback');
        form2.append('description', 'Testing upload WITHOUT simple AI metadata');
        form2.append('category', 'others'); // User manually selected
        form2.append('location', 'Test Lab');
        form2.append('date_lost', new Date().toISOString());
        form2.append('user_id', 'guest');
        form2.append('contact_email', 'guest@example.com');
        // No ai_metadata appended
        form2.append('image', fs.createReadStream(TEST_IMAGE_PATH));

        const res2 = await axios.post(`${BASE_URL}/items/lost`, form2, {
            headers: { ...form2.getHeaders() }
        });

        if (res2.status === 201 && res2.data.id) {
            console.log(`✅ Success: Item created with ID ${res2.data.id}`);

            // Verify DB Persistence
            const dbCheck2 = await pool.query("SELECT * FROM lost_items WHERE title = 'QA Test Item - Fallback' ORDER BY created_at DESC LIMIT 1");
            if (dbCheck2.rows.length > 0) {
                console.log('✅ DB Verification Passed: Record exists (graceful degradation confirmed).');
            } else {
                console.error('❌ DB Verification Failed: Record missing.');
                exitCode = 1;
            }
        } else {
            console.error('❌ Resilience Test Failed:', res2.status, res2.data);
            exitCode = 1;
        }

        // --- TEST CASE 3: View Items (Retrieval) ---
        console.log('\n📝 Test Case 3: Verify Item Retrieval (GET /api/items)');
        const res3 = await axios.get(`${BASE_URL}/items?type=lost`);
        if (res3.status === 200 && Array.isArray(res3.data)) {
            const found = res3.data.find(i => i.title === 'QA Test Item - Happy Path');
            if (found && found.imageUrl && found.imageUrl.startsWith('http')) {
                console.log('✅ Retrieval Verification Passed: Item found in list with valid Image URL.');
            } else {
                console.error('❌ Retrieval Verification Failed: Item not found or invalid Image URL.');
                console.log('Found item sample:', found);
                exitCode = 1;
            }
        } else {
            console.error('❌ GET /items Failed');
            exitCode = 1;
        }

    } catch (err) {
        console.error('❌ Unexpected Error:', err.message);
        if (err.response) {
            console.error('Response Data:', err.response.data);
        }
        exitCode = 1;
    } finally {
        await pool.end();
        process.exit(exitCode);
    }
}

testE2EUpload();
