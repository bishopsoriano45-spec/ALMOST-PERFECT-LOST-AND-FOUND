const claimsService = require('./services/claimsService');
const db = require('./db/db');

async function testClaim() {
    console.log('🧪 Testing Claim Submission with "guest" ID...');
    try {
        const claim = await claimsService.createClaim({
            lostItemId: null,
            foundItemId: 1, // Assume item 1 exists
            claimerId: 'guest',
            matchScore: 0,
            verificationNotes: 'Test Claim from Guest'
        });
        console.log('✅ Claim created successfully:', claim);
    } catch (error) {
        console.error('❌ Claim creation failed:', error.message);
        if (error.code === '23503') {
            console.log('⚠️ Foreign Key Violation detected (User "guest" does not exist).');
        }
    } finally {
        process.exit();
    }
}

testClaim();
