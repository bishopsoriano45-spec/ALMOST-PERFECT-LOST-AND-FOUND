const emailService = require('./services/emailService');

/**
 * Test email configuration and send a test email
 */
async function testEmail() {
    console.log('Testing email configuration...\n');

    // Test configuration
    const configTest = await emailService.testEmailConfiguration();
    console.log('Configuration test:', JSON.stringify(configTest, null, 2));

    if (!configTest.success) {
        console.error('\n❌ Email configuration failed!');
        console.error('Please check your .env file and ensure:');
        console.error('1. EMAIL_SERVICE is set (e.g., "gmail")');
        console.error('2. EMAIL_USER is set to your email address');
        console.error('3. EMAIL_PASSWORD is set to your app password');
        console.error('4. ENABLE_EMAIL_NOTIFICATIONS is set to "true"');
        return;
    }

    console.log('\n✅ Email configuration is valid!');

    // Send test email
    const testRecipient = process.env.EMAIL_USER; // Send to yourself for testing

    console.log(`\nSending test match notification email to ${testRecipient}...`);

    const testData = {
        userName: 'Test User',
        userItemTitle: 'Black iPhone 14',
        matchedItemTitle: 'iPhone with Clear Case',
        matchScore: 0.85,
        confidence: 'high',
        explanation: [
            'High visual similarity (92%)',
            'Same category: phone',
            'Similar location: Library',
            'Reported within 2 days'
        ],
        matchedItem: {
            id: 'found_1',
            title: 'iPhone with Clear Case',
            // Use a real file from the uploads directory (via server URL)
            imageUrl: 'http://localhost:3000/uploads/1771062410751.jpg',
            location: 'Library - Study Area',
            dateReported: new Date().toISOString()
        },
        itemLink: 'http://localhost:5173/item/found_1'
    };

    const result = await emailService.sendMatchNotificationEmail(testRecipient, testData);

    if (result.success) {
        console.log('\n✅ Test email sent successfully!');
        console.log('Message ID:', result.messageId);
        console.log(`\nCheck your inbox at ${testRecipient}`);
    } else {
        console.error('\n❌ Failed to send test email');
        console.error('Error:', result.error || result.message);
    }
}

// Run the test
testEmail().catch(error => {
    console.error('Test failed:', error);
    process.exit(1);
});
