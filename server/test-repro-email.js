const db = require('./db/db');
const notificationService = require('./services/notificationService');
const matchingService = require('./services/matchingService');

// Mock data
const mockUser = {
    id: 'test_user_repro',
    email: 'test_repro@example.com'
};

const mockItem = {
    id: 'lost_test_1',
    type: 'lost',
    title: 'Test Lost Item',
    user_id: mockUser.id,
    contact_email: 'test_contact@example.com' // Explicit contact email
};

const mockMatch = {
    item: {
        id: 'found_test_1',
        title: 'Test Found Match',
        imageUrl: 'http://localhost:3000/uploads/test.jpg',
        location: 'Test Location',
        dateReported: new Date().toISOString(),
        userId: 'other_user'
    },
    matchScore: 0.95,
    confidence: 'high',
    explanation: ['Exact visual match'],
    details: {}
};

async function runTest() {
    console.log('--- Starting Repro Test ---');

    // 1. Test getUserEmail
    // We need to insert a dummy user first to test DB lookup
    await new Promise(resolve => {
        db.run(`INSERT INTO users (user_id, email, password_hash, name) VALUES (?, ?, 'hash', 'Test User') ON CONFLICT (user_id) DO NOTHING`,
            [mockUser.id, mockUser.email], (err) => {
                if (err) console.error('Setup User Error:', err);
                else console.log('Setup: User inserted/exists');
                resolve();
            });
    });

    console.log(`Testing getUserEmail for ${mockUser.id}...`);
    const dbEmail = await notificationService.getUserEmail(mockUser.id); // This function is not exported? Wait, let me check.
    // notificationService.js DOES NOT export getUserEmail. It is internal.
    // But createMatchNotification calls it.

    // 2. Test createMatchNotification with contact_email
    console.log('\n--- Test 1: With contact_email ---');
    try {
        const result = await notificationService.createMatchNotification(
            mockUser.id,
            mockItem,
            mockMatch
        );
        console.log('Result 1:', result ? 'Notification Created' : 'Failed');
    } catch (e) {
        console.error('Error in Test 1:', e);
    }

    // 3. Test createMatchNotification WITHOUT contact_email (fallback to DB)
    console.log('\n--- Test 2: Fallback to DB email ---');
    const mockItemNoEmail = { ...mockItem, contact_email: null };
    try {
        const result = await notificationService.createMatchNotification(
            mockUser.id,
            mockItemNoEmail,
            mockMatch
        );
        console.log('Result 2:', result ? 'Notification Created' : 'Failed');
    } catch (e) {
        console.error('Error in Test 2:', e);
    }

    console.log('\n--- Test Complete ---');
    // Note: This script assumes the server process env is loaded or defaults are used. 
    // We are running this with node, so we need dotenv.
}

// Load env
require('dotenv').config();

runTest();
