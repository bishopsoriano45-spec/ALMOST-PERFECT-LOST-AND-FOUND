const fs = require('fs');
const path = require('path');
// Node.js v18+ has native fetch and FormData
// but for file reading into Blob we can use fs.openAsBlob (Node v20+)

async function testAiApi() {
    try {
        // Check if server is reachable
        try {
            const healthRes = await fetch('http://localhost:3000/api/health');
            if (!healthRes.ok) throw new Error('Health check failed');
            console.log('Backend is reachable.');
        } catch (e) {
            console.error('Backend is NOT reachable. Please start the server (npm run dev:server).');
            process.exit(1);
        }

        const testImagePath = path.join(__dirname, '../test_debug.jpg');

        if (!fs.existsSync(testImagePath)) {
            console.error(`Test image not found at ${testImagePath}`);
            // Create a dummy file if needed, or fail
            process.exit(1);
        }

        console.log(`Testing with image: ${testImagePath}`);

        // Create Blob from file (Node.js 20+)
        // If openAsBlob is not available (unlikely in v24), we can read buffer and create Blob
        const { openAsBlob } = fs;
        let blob;
        if (openAsBlob) {
            blob = await openAsBlob(testImagePath);
        } else {
            const buffer = fs.readFileSync(testImagePath);
            blob = new Blob([buffer]);
        }

        const formData = new FormData();
        formData.append('image', blob, 'test_debug.jpg');

        console.log('Sending request to /api/ai/detect...');
        const response = await fetch('http://localhost:3000/api/ai/detect', {
            method: 'POST',
            body: formData,
        });

        console.log('Response status:', response.status);

        if (!response.ok) {
            const text = await response.text();
            console.error('Request failed:', text);
            return;
        }

        const data = await response.json();
        console.log('Response data:', JSON.stringify(data, null, 2));

        if (data.detections) {
            console.log('SUCCESS: Detections received.');
            const detections = data.detections;
            if (detections.length > 0) {
                console.log(`First detection class: ${detections[0].class}`);
                console.log(`First detection model type: ${detections[0].model_type}`);

                if (detections[0].model_type === 'custom') {
                    console.log('VERIFIED: Using custom model!');
                } else {
                    console.log('WARNING: Using base model (not custom).');
                }
            } else {
                console.log('No objects detected (this might be expected depending on the image).');
            }
        } else {
            console.error('FAILURE: Unexpected response format.');
        }

    } catch (error) {
        console.error('Test failed:', error);
    }
}

testAiApi();
