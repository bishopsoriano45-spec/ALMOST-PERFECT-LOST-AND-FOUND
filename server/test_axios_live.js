const axios = require('axios');
const FormData = require('form-data');
const fs = require('fs');

async function triggerItemFoundError() {
    try {
        const formData = new FormData();
        formData.append('title', 'Test API Title Local');
        formData.append('description', 'Testing');
        formData.append('category', 'other');
        formData.append('location', 'Library');
        formData.append('user_id', 'guest');
        formData.append('contact_email', 'test@test.com');

        console.log('Sending Axios POST to https://almost-perfect-lost-and-found.onrender.com/api/items/found');

        const response = await axios.post('https://almost-perfect-lost-and-found.onrender.com/api/items/found', formData, {
            headers: formData.getHeaders(),
            timeout: 30000
        });

        console.log('Success!', response.data);
    } catch (e) {
        if (e.response) {
            console.error('API Error (500):', e.response.status);
            console.error('Response Data:', e.response.data);
        } else {
            console.error('Network Error:', e.message);
        }
    }
}

triggerItemFoundError();
