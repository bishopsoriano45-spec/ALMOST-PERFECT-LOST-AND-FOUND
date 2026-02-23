const axios = require('axios');
const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });
console.log('DEBUG: DB_PASSWORD type:', typeof process.env.DB_PASSWORD);
console.log('DEBUG: DB_PASSWORD length:', process.env.DB_PASSWORD ? process.env.DB_PASSWORD.length : 0);
const db = require('./db/db');

// Configuration
const BASE_URL = 'http://localhost:3000/api';
const EMAIL_USER = process.env.EMAIL_USER;

// Test Data
const testUser = {
    userId: 'test_points_user_' + Date.now(),
    email: 'test_points@example.com',
    password: 'password123',
    name: 'Test Points User'
};

const lostItem = {
    title: 'Lost Keys for Points Test',
    description: 'Keys with a red keychain',
    category: 'Electronics', // Using a valid category
    location: 'Central Park',
    date_lost: new Date().toISOString(),
    user_id: 'guest', // Lost item by guest
    contact_email: 'loser@example.com'
};

const foundItem = {
    title: 'Found Keys for Points Test',
    description: 'Keys with a red keychain found on bench',
    category: 'Electronics',
    location: 'Central Park',
    date_found: new Date().toISOString(),
    user_id: testUser.userId, // Found item by our test user
    contact_email: testUser.email
};

async function verifyPointsSystem() {
    console.log('--- Starting Points System Verification ---');

    try {
        // 1. Create Test User
        console.log(`Creating test user: ${testUser.userId}`);
        // Manually insert user since register endpoint might need auth or be complex
        await new Promise((resolve, reject) => {
            db.run(`INSERT INTO users (user_id, email, password, name, points) VALUES (?, ?, ?, ?, 0)`,
                [testUser.userId, testUser.email, testUser.password, testUser.name],
                (err) => {
                    if (err) reject(err);
                    else resolve();
                });
        });

        // 2. Report Found Item (Should award 1 point)
        console.log('Reporting found item...');
        const foundRes = await axios.post(`${BASE_URL}/items/found`, foundItem);
        const foundId = foundRes.data.id;
        console.log(`Found item reported. ID: ${foundId}`);

        // Check points
        let user = await new Promise((resolve, reject) => {
            db.get(`SELECT points FROM users WHERE user_id = ?`, [testUser.userId], (err, row) => {
                if (err) reject(err);
                else resolve(row);
            });
        });
        console.log(`Points after reporting found item: ${user.points}`);

        if (user.points !== 1) {
            console.error('FAIL: User should have 1 point after reporting found item.');
        } else {
            console.log('PASS: User has 1 point.');
        }

        // 3. Report Lost Item (to create match)
        console.log('Reporting lost item...');
        const lostRes = await axios.post(`${BASE_URL}/items/lost`, lostItem);
        const lostId = lostRes.data.id;
        console.log(`Lost item reported. ID: ${lostId}`);

        // 4. Create Claim
        console.log('Creating claim...');
        // Need to simulate a match first? The system matches automatically.
        // Let's manually create a claim for simplicity as if the user claimed it
        // Note: The CLAIMER should be the loser. The POINTS go to the Finder (testUser).

        // We need an admin token to approve. Using a mock or direct DB update for claim creation?
        // Let's try the claim endpoint.

        // Login as admin for approval later
        // Assuming admin exists or we can fake it. 
        // Let's just create the claim directly in DB to skip auth complexity for this script

        const claimId = Date.now();
        await new Promise((resolve, reject) => {
            db.run(`INSERT INTO claims (lost_item_id, found_item_id, claimer_id, claimer_email, status, match_score) VALUES (?, ?, ?, ?, 'pending', 0.9)`,
                [lostId.split('_')[1], foundId.split('_')[1], 'guest_loser', 'loser@example.com'],
                (err) => {
                    if (err) reject(err);
                    else resolve();
                });
        });

        // Get the claim ID we just inserted? 
        // Actually, let's use the API if possible, or just query the last claim
        const claimRow = await new Promise((resolve, reject) => {
            db.get(`SELECT id FROM claims WHERE lost_item_id = ? AND found_item_id = ?`,
                [lostId.split('_')[1], foundId.split('_')[1]], (err, row) => {
                    if (err) reject(err);
                    else resolve(row);
                });
        });

        console.log(`Claim created. ID: ${claimRow.id}`);

        // 5. Approve Claim (Should award 5 points)
        // We need auth token for admin. 

        const adminUser = {
            userId: 'admin_test_' + Date.now(),
            email: 'admin_test@example.com',
            password: 'AdminPassword123!', // Strong password string
            role: 'admin'
        };

        await new Promise((resolve, reject) => {
            db.run(`INSERT INTO users (user_id, email, password, role, name) VALUES (?, ?, ?, ?, ?)`,
                [adminUser.userId, adminUser.email, adminUser.password, 'admin', 'Admin Test'],
                (err) => {
                    if (err) reject(err);
                    else resolve();
                });
        });

        const loginRes = await axios.post(`${BASE_URL}/auth/login`, {
            email: adminUser.email,
            password: adminUser.password
        });
        const token = loginRes.data.token;
        console.log('Admin logged in.');

        console.log('Desidered Claim ID:', claimRow.id);
        console.log('Approving claim...');
        await axios.post(`${BASE_URL}/admin/claims/${claimRow.id}/process`, {
            decision: 'approved',
            notes: 'Verified via script'
        }, {
            headers: { Authorization: `Bearer ${token}` }
        });

        // Check points again
        user = await new Promise((resolve, reject) => {
            db.get(`SELECT points FROM users WHERE user_id = ?`, [testUser.userId], (err, row) => {
                if (err) reject(err);
                else resolve(row);
            });
        });

        console.log(`Points after claim approval: ${user.points}`);

        // Expected: 1 (initial) + 5 (approval) = 6
        if (user.points !== 6) {
            console.error(`FAIL: User should have 6 points (1 + 5). Found: ${user.points}`);
        } else {
            console.log('PASS: User has 6 points (1 + 5 verified).');
        }

    } catch (error) {
        console.error('Verification failed:', error.response ? error.response.data : error.message);
    } finally {
        // Cleanup?
        // db.close(); 
        console.log('--- Verification Complete ---');
    }
}

verifyPointsSystem();
