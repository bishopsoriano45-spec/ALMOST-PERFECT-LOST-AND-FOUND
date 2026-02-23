const notificationService = require('./services/notificationService');
const { pool } = require('./db/db');
require('dotenv').config();

async function testFullFlow() {
    console.log('Testing full notification flow...');

    try {
        // User we seeded
        const userId = 'user_test_123';

        // Check if user exists
        const client = await pool.connect();
        const userRes = await client.query('SELECT * FROM users WHERE user_id = $1', [userId]);
        client.release();

        if (userRes.rows.length === 0) {
            console.error('❌ Test user not found. Did you run seed-users.js?');
            return;
        }
        console.log(`Found test user: ${userRes.rows[0].email}`);

        // Mock Item Data
        const userItem = {
            id: 'lost_test_item',
            type: 'lost',
            title: 'Lost Blue Wallet',
            description: 'A blue leather wallet lost in the park.'
        };

        const match = {
            matchScore: 0.95,
            confidence: 'high',
            explanation: ['Same category', 'High visual similarity', 'Location match'],
            details: 'Visual match confirmed by AI.',
            item: {
                id: 'found_test_item',
                title: 'Found Blue Leather Wallet',
                imageUrl: 'http://localhost:3000/uploads/sample-wallet.jpg',
                location: 'Central Park',
                dateReported: new Date().toISOString(),
                userId: 'user_finder_456'
            }
        };

        console.log('Triggering match notification...');

        // This should trigger:
        // 1. DB Insert into notifications table
        // 2. Email lookup for userId
        // 3. Email sending via nodemailer
        await notificationService.createMatchNotification(userId, userItem, match);

        console.log('✅ Notification created. Check console for "Match notification email sent" message.');

        // Give time for async email to send (createMatchNotification doesn't wait for email)
        await new Promise(resolve => setTimeout(resolve, 5000));

    } catch (error) {
        console.error('❌ Test failed:', error);
    } finally {
        await pool.end();
    }
}

testFullFlow();
