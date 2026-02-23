const axios = require('axios');
require('dotenv').config();

const API_URL = 'http://localhost:3000/api/admin';
const CREDENTIALS = {
    username: process.env.ADMIN_USER || 'admin',
    password: process.env.ADMIN_PASS || 'admin123'
};

async function verify() {
    try {
        console.log('Authenticating...');
        const loginRes = await axios.post(`${API_URL}/login`, CREDENTIALS);
        const token = loginRes.data.token;
        console.log('Token acquired.');

        console.log('Fetching points stats...');
        const statsRes = await axios.get(`${API_URL}/points/stats`, {
            headers: { Authorization: `Bearer ${token}` }
        });

        console.log('Response Status:', statsRes.status);
        console.log('Response Data:', JSON.stringify(statsRes.data, null, 2));

        if (statsRes.data.success && statsRes.data.data) {
            console.log('✅ VERIFICATION SUCCESS: Endpoint returns valid format.');
        } else {
            console.error('❌ VERIFICATION FAILED: Invalid response format.');
            process.exit(1);
        }

    } catch (error) {
        console.error('❌ VERIFICATION ERROR:', error.message);
        if (error.response) {
            console.error('Response data:', error.response.data);
        }
        process.exit(1);
    }
}

verify();
