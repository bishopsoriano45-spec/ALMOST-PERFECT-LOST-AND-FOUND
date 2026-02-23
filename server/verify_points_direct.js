const { Pool } = require('pg');
const axios = require('axios');
const path = require('path');
const crypto = require('crypto');
require('dotenv').config({ path: path.join(__dirname, '.env') });

console.log('DB_PASSWORD length:', process.env.DB_PASSWORD ? process.env.DB_PASSWORD.length : 0);

// Pool setup
const pool = new Pool({
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 5432,
    database: process.env.DB_NAME || 'lost_found',
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD,
});

const BASE_URL = 'http://localhost:3000/api';

const hashPassword = (password) => {
    return crypto.createHash('sha256').update(password).digest('hex');
};

const testUser = {
    userId: 'test_points_user_' + Date.now(),
    email: 'test_points@example.com',
    password: 'password123',
};

const lostItem = {
    title: 'Lost Keys for Points Test',
    description: 'Keys with a red keychain',
    category: 'Electronics',
    location: 'Central Park',
    date_lost: new Date().toISOString(),
    user_id: 'guest',
    contact_email: 'loser@example.com'
};

const foundItem = {
    title: 'Found Keys for Points Test',
    description: 'Keys with a red keychain found on bench',
    category: 'Electronics',
    location: 'Central Park',
    date_found: new Date().toISOString(),
    user_id: testUser.userId,
    contact_email: testUser.email
};

async function run() {
    try {
        console.log('Connecting to DB...');
        await pool.query('SELECT NOW()');
        console.log('DB Connected.');

        // 1. Create Finder User
        console.log(`Creating user ${testUser.userId}`);
        const hashedPassword = hashPassword(testUser.password);
        await pool.query('INSERT INTO users (user_id, email, password_hash, role, points, created_at) VALUES ($1, $2, $3, $4, 0, NOW())',
            [testUser.userId, testUser.email, hashedPassword, 'user']);

        // 2. Report Found Item
        console.log('Reporting found item...');
        const foundRes = await axios.post(`${BASE_URL}/items/found`, foundItem);
        const foundId = foundRes.data.id;
        console.log('Found Item ID:', foundId);

        // Check points (Should be 1)
        const userRes = await pool.query('SELECT points FROM users WHERE user_id = $1', [testUser.userId]);
        const points = userRes.rows[0].points;
        console.log(`Points after found report: ${points}`);

        if (points !== 1) console.error('FAIL: Expected 1 point, got ' + points);
        else console.log('PASS: 1 point awarded.');

        // 3. Report Lost Item
        console.log('Reporting lost item...');
        const lostRes = await axios.post(`${BASE_URL}/items/lost`, lostItem);
        const lostId = lostRes.data.id;
        console.log('Lost Item ID:', lostId);

        // 4. Create Claim
        // Create a user to be the claimer (loser) to satisfy FK constraint
        const loserId = 'loser_' + Date.now();
        await pool.query('INSERT INTO users (user_id, email, password_hash, role, points, created_at) VALUES ($1, $2, $3, $4, 0, NOW())',
            [loserId, 'loser@example.com', hashPassword('password123'), 'user']);

        const foundDbId = foundId.split('_')[1];
        const lostDbId = lostId.split('_')[1];

        console.log('Creating claim...');
        const claimRes = await pool.query(`INSERT INTO claims (lost_item_id, found_item_id, claimer_id, status, match_score) 
            VALUES ($1, $2, $3, 'pending', 0.9) RETURNING id`,
            [lostDbId, foundDbId, loserId]);
        const claimId = claimRes.rows[0].id;
        console.log('Claim ID:', claimId);

        // 5. Approve Claim
        console.log('Logging in as Admin...');
        const adminUser = process.env.ADMIN_USER || 'admin';
        const adminPass = process.env.ADMIN_PASS || 'admin123';
        const loginRes = await axios.post(`${BASE_URL}/admin/login`, {
            username: adminUser,
            password: adminPass
        });
        const token = loginRes.data.token;
        console.log('Admin logged in.');

        console.log('Approving claim...');
        await axios.post(`${BASE_URL}/admin/claims/${claimId}/process`, {
            decision: 'approved',
            notes: 'Verified via direct script'
        }, { headers: { Authorization: `Bearer ${token}` } });

        // Check points (Should be 1 + 5 = 6)
        const userRes2 = await pool.query('SELECT points FROM users WHERE user_id = $1', [testUser.userId]);
        const points2 = userRes2.rows[0].points;
        console.log(`Points after claim approval: ${points2}`);

        if (points2 !== 6) console.error(`FAIL: Expected 6 points (1+5), got ${points2}`);
        else console.log('PASS: 6 points verified (1+5).');

    } catch (err) {
        console.error('Verification failed:', err.response ? err.response.data : err);
    } finally {
        await pool.end();
    }
}

run();
