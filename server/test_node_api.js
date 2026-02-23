const axios = require('axios');
const FormData = require('form-data');
const fs = require('fs');
const path = require('path');

async function triggerItemFoundError() {
    let output = '';
    try {
        const formData = new FormData();
        const imgPath = path.join(__dirname, 'test_debug.jpg');

        formData.append('title', 'Test API Title');
        formData.append('description', 'Testing');
        formData.append('category', 'other');
        formData.append('location', 'Library');
        formData.append('user_id', 'guest');
        formData.append('contact_email', 'test@test.com');
        formData.append('file', fs.createReadStream(imgPath), 'test_debug.jpg');

        output += 'Sending request to Live Node API...\n';
        const response = await axios.post('https://almost-perfect-lost-and-found.onrender.com/api/items/found', formData, {
            headers: formData.getHeaders()
        });

        output += 'Success! Response: ' + JSON.stringify(response.data) + '\n';
    } catch (e) {
        if (e.response) {
            output += 'API Error (500): ' + e.response.status + '\n';
            output += 'Response Data: ' + JSON.stringify(e.response.data) + '\n';
        } else {
            output += 'Network Error: ' + e.message + '\n';
        }
    }
    fs.writeFileSync('C:\\Users\\Jade\\Downloads\\github\\ALMOST PERFECT LOST AND FOUND (2)\\ALMOST PERFECT LOST AND FOUND\\server\\api_test_out.txt', output);
}

triggerItemFoundError();
