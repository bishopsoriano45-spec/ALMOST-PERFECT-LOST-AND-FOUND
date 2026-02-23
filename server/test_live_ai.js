const axios = require('axios');
const FormData = require('form-data');
const fs = require('fs');
const path = require('path');

async function testLiveAI() {
    try {
        const formData = new FormData();
        // Create a dummy image
        const imgPath = path.join(__dirname, 'test_debug.jpg');
        // If test_debug.jpg doesn't exist, we fallback
        if (!fs.existsSync(imgPath)) {
            console.error('Test image not found, please provide a valid JPEG path');
            return;
        }

        formData.append('file', fs.createReadStream(imgPath), 'test_debug.jpg');

        console.log('Sending request to live AI Service...');
        const response = await axios.post('https://lost-found-ai.onrender.com/analyze-hybrid', formData, {
            headers: formData.getHeaders()
        });

        console.log('Success! Response:', JSON.stringify(response.data, null, 2));
    } catch (e) {
        if (e.response) {
            console.error('AI Service Error (500):', e.response.status);
            console.error('Response Data:', e.response.data);
        } else {
            console.error('Network Error:', e.message);
        }
    }
}

testLiveAI();
