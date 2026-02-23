const axios = require('axios');
const FormData = require('form-data');
const fs = require('fs');
const path = require('path');

async function testLiveAI() {
    let output = '';
    try {
        const formData = new FormData();
        const imgPath = path.join(__dirname, 'test_debug.jpg');

        formData.append('file', fs.createReadStream(imgPath), 'test_debug.jpg');

        output += 'Sending request...\n';
        const response = await axios.post('https://lost-found-ai.onrender.com/analyze-hybrid', formData, {
            headers: formData.getHeaders()
        });

        output += 'Success! Response: ' + JSON.stringify(response.data) + '\n';
    } catch (e) {
        if (e.response) {
            output += 'AI Service Error (500): ' + e.response.status + '\n';
            output += 'Response Data: ' + JSON.stringify(e.response.data) + '\n';
        } else {
            output += 'Network Error: ' + e.message + '\n';
        }
    }
    fs.writeFileSync('C:\\Users\\Jade\\Downloads\\github\\ALMOST PERFECT LOST AND FOUND (2)\\ALMOST PERFECT LOST AND FOUND\\server\\ai_output.txt', output);
}

testLiveAI();
