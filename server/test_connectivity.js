/**
 * Debug Script - Test Backend Connectivity
 * Run with: node server/test_connectivity.js
 */
const axios = require('axios');

const BASE_URL = 'http://localhost:3000';
const AI_SERVICE_URL = 'http://localhost:5000';
const ADMIN_CREDS = { username: 'admin', password: 'admin123' };

async function testBackend() {
    console.log('\n=== Backend Connectivity Test ===\n');

    let backendRunning = false;
    let dbConnected = false;
    let adminLoginWorks = false;
    let userLoginWorks = false;

    // Test 1: Backend server health
    console.log('1. Testing backend server (port 3000)...');
    try {
        const healthRes = await axios.get(`${BASE_URL}/api/health`, { timeout: 5000 });
        console.log(`   ✅ Backend is running: ${healthRes.data.message}`);
        backendRunning = true;
    } catch (err) {
        console.log(`   ❌ Backend not accessible: ${err.message}`);
        if (err.code === 'ECONNREFUSED') {
            console.log('   📝 FIX: Start the backend with: cd server && npm start');
        }
    }

    if (!backendRunning) {
        console.log('\n⚠️  Backend is not running. Please start it first.');
        return;
    }

    // Test 2: Database connection via health check
    console.log('\n2. Testing database connection...');
    try {
        const response = await axios.get(`${BASE_URL}/api/health`, { timeout: 5000 });
        if (response.data.database === 'connected' || response.data.status === 'ok') {
            console.log('   ✅ Database is connected');
            dbConnected = true;
        }
    } catch (err) {
        console.log(`   ❌ Database issue: ${err.message}`);
    }

    // Test 3: Admin API Login
    console.log('\n3. Testing admin login...');
    try {
        const adminRes = await axios.post(`${BASE_URL}/api/admin/login`, ADMIN_CREDS, { timeout: 10000 });
        console.log(`   ✅ Admin login successful!`);
        console.log(`   Token: ${adminRes.data.token ? 'received' : 'missing'}`);
        adminLoginWorks = true;
    } catch (err) {
        if (err.response) {
            console.log(`   ❌ Admin login failed: ${err.response.status} - ${JSON.stringify(err.response.data)}`);
        } else if (err.code === 'ETIMEDOUT' || err.code === 'ECONNABORTED') {
            console.log(`   ❌ Admin login timed out (504): Database might be hanging`);
            console.log('   📝 FIX: Check PostgreSQL is running');
        } else {
            console.log(`   ❌ Admin login error: ${err.message}`);
        }
    }

    // Test 4: User Login (if admin worked)
    if (adminLoginWorks) {
        console.log('\n4. Testing user login...');
        try {
            // Test with a mock user (will fail but should connect to DB)
            const userRes = await axios.post(`${BASE_URL}/api/users/login`,
                { email: 'test@gmail.com', password: 'test123' },
                { timeout: 10000 }
            );
            console.log(`   ✅ User login endpoint works`);
            userLoginWorks = true;
        } catch (err) {
            if (err.response && err.response.status === 401) {
                // Expected - user doesn't exist but endpoint works
                console.log(`   ✅ User login endpoint works (expected 401 for invalid user)`);
                userLoginWorks = true;
            } else if (err.code === 'ETIMEDOUT' || err.code === 'ECONNABORTED') {
                console.log(`   ❌ User login timed out (504): Database issue`);
            } else {
                console.log(`   ⚠️  User login: ${err.message}`);
            }
        }
    }

    // Test 5: AI Service Health
    let aiServiceRunning = false;
    console.log('\n5. Testing AI Service (port 5000)...');
    try {
        const aiRes = await axios.get(`${AI_SERVICE_URL}/health`, { timeout: 5000 });
        if (aiRes.data.status === 'ok') {
            console.log(`   ✅ AI Service is running: ${aiRes.data.message}`);
            aiServiceRunning = true;
        }
    } catch (err) {
        console.log(`   ❌ AI Service not accessible: ${err.message}`);
        if (err.code === 'ECONNREFUSED') {
            console.log('   📝 FIX: Start the AI service (python ai_service/main.py)');
        }
    }

    // Summary
    console.log('\n=== Summary ===');
    console.log(`Backend: ${backendRunning ? '✅ Running' : '❌ Not Running'}`);
    console.log(`Database: ${dbConnected ? '✅ Connected' : '⚠️  Unknown'}`);
    console.log(`AI Service: ${aiServiceRunning ? '✅ Running' : '❌ Not Running'}`);
    console.log(`Admin Login: ${adminLoginWorks ? '✅ Working' : '❌ Failed'}`);
    console.log(`User Login: ${userLoginWorks ? '✅ Working' : '❌ Failed'}`);

    if (!adminLoginWorks && backendRunning) {
        console.log('\n📋 Next Steps:');
        console.log('1. Check PostgreSQL is running');
        console.log('2. Check database "lostandfound" exists');
        console.log('3. Check server/.env has correct DB credentials');
    }
}

testBackend();
