const claimsService = require('./services/claimsService');
const db = require('./db/db');

async function testClaim() {
    console.log('🧪 Testing Claim Submission with "guest" ID + Email...');
    const testEmail = `guest_test_${Date.now()}@example.com`; // Unique email

    try {
        // Fetch a valid found item ID
        const validItem = await db.query('SELECT id FROM found_items LIMIT 1');
        if (validItem.rows.length === 0) {
            console.error('❌ No found items in DB to test with.');
            process.exit(1);
        }
        const itemId = validItem.rows[0].id;
        console.log(`ℹ️ Using valid Found Item ID: ${itemId}`);

        const claim = await claimsService.createClaim({
            lostItemId: null,
            foundItemId: itemId,
            claimerId: 'guest',
            claimerEmail: testEmail,
            claimerName: 'Test Guest',
            matchScore: 0,
            verificationNotes: 'Test Claim from Guest with Email'
        });
        console.log('✅ Claim created successfully:', claim);
        console.log(`   Linked to User ID: ${claim.claimer_id} (Should not be "guest")`);

    } catch (error) {
        console.error('❌ Claim creation failed:', error);
    } finally {
        process.exit();
    }
}

testClaim();
