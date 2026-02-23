const fs = require('fs');
const path = require('path');
const { openAsBlob } = require('node:fs');

async function testHybridAi() {
    console.log('Testing Hybrid AI Analysis...');

    // 1. Check if backend is reachable
    try {
        const healthCheck = await fetch('http://localhost:3000/');
        if (!healthCheck.ok) throw new Error('Backend not reachable');
        console.log('Backend is reachable.');
    } catch (e) {
        console.error('Backend connection failed:', e.message);
        process.exit(1);
    }

    // 2. Prepare test image
    const testImagePath = path.join(__dirname, '../test_debug.jpg');

    if (!fs.existsSync(testImagePath)) {
        console.error(`Test image not found at ${testImagePath}`);
        process.exit(1);
    }

    console.log(`Testing with image: ${testImagePath}`);

    try {
        const blob = await openAsBlob(testImagePath);
        const formData = new FormData();
        formData.append('image', blob, 'test_debug.jpg');
        formData.append('context', 'This is a test image.');

        console.log('Sending request to /api/ai/analyze-hybrid...');
        const startTime = Date.now();
        const response = await fetch('http://localhost:3000/api/ai/analyze-hybrid', {
            method: 'POST',
            body: formData,
        });
        const duration = Date.now() - startTime;

        console.log(`Response status: ${response.status}`);

        if (!response.ok) {
            const errorText = await response.text();
            console.error('Error response:', errorText);
            throw new Error(`API Error: ${response.status} ${response.statusText}`);
        }

        const data = await response.json();
        console.log('Response data:', JSON.stringify(data, null, 2));

        // Validation
        if (data.detections && data.message === 'Hybrid analysis successful') {
            console.log('SUCCESS: Hybrid Analysis returned results.');
            console.log(`Time taken: ${duration}ms`);

            if (data.description) {
                console.log('✅ Gemini Description received:', data.description);
            } else {
                console.log('⚠️ No Gemini description received (Check API Key or logs)');
            }

            if (data.detections.length > 0) {
                console.log(`✅ YOLO Detections: ${data.detections.length}`);
            } else {
                console.log('⚠️ No YOLO detections (might be expected for this image)');
            }

        } else {
            console.error('FAILURE: Unexpected response structure.');
        }

    } catch (error) {
        console.error('Test failed:', error);
        process.exit(1);
    }
}

testHybridAi();
