// Test script to verify matching and notification system
require('dotenv').config({ path: require('path').resolve(__dirname, '.env') });
const db = require('./db/db');
const matchingService = require('./services/matchingService');
const notificationService = require('./services/notificationService');

async function testMatching() {
    console.log('=== Testing Matching and Notification System ===\n');

    try {
        // 1. Check if there are items in the database
        console.log('1. Checking database for items...');
        const lostItems = await db.query('SELECT * FROM lost_items ORDER BY created_at DESC LIMIT 5');
        const foundItems = await db.query('SELECT * FROM found_items ORDER BY created_at DESC LIMIT 5');

        console.log(`   Found ${lostItems.rows.length} lost items`);
        console.log(`   Found ${foundItems.rows.length} found items`);

        if (lostItems.rows.length === 0 || foundItems.rows.length === 0) {
            console.log('\n   WARNING: Need at least one lost item and one found item to test matching');
            return;
        }

        // 2. Test matching - use the most recent lost item and try to find matches in found items
        const testLostItem = lostItems.rows[0];
        console.log(`\n2. Testing matching for lost item: "${testLostItem.title}"`);

        const matches = await matchingService.findPotentialMatches(testLostItem, 'lost', 0.3); // Lower threshold for testing
        console.log(`   Found ${matches.length} potential matches`);

        if (matches.length > 0) {
            console.log('\n3. Testing notification for first match...');
            const match = matches[0];

            const notification = await notificationService.createMatchNotification(
                testLostItem.user_id,
                { id: `lost_${testLostItem.id}`, type: 'lost', title: testLostItem.title, contact_email: testLostItem.contact_email },
                match
            );
            console.log('   Notification created:', notification ? 'SUCCESS' : 'FAILED');
        } else {
            console.log('\n   No matches found - this is expected if items are not similar enough');
        }

        console.log('\n=== Test Complete ===');
    } catch (error) {
        console.error('Error:', error.message);
    }

    process.exit(0);
}

testMatching();
