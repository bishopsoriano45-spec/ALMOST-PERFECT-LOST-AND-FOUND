
async function testFeedback() {
    try {
        console.log('Testing Feedback API...');
        const response = await fetch('http://localhost:3000/api/feedback', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                userName: 'Test User',
                userEmail: 'test@example.com',
                message: 'This is a test feedback message',
                type: 'complaint'
            })
        });

        if (response.ok) {
            const data = await response.json();
            console.log('✅ Feedback submitted successfully:', data);
        } else {
            console.error(`❌ Feedback submission failed: ${response.status} ${response.statusText}`);
            const text = await response.text();
            console.error('Response:', text);
        }
    } catch (error) {
        console.error('❌ Network error:', error.message);
    }
}

testFeedback();
