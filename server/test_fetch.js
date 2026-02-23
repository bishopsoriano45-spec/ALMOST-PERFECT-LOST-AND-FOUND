const fs = require('fs');

async function testLiveAPI() {
    let output = "Starting test...\n";
    try {
        const fetch = (await import('node-fetch')).default;

        // This simulates a standard FormData from the browser
        const { FormData } = await import('formdata-node');
        const form = new FormData();
        form.append('title', 'Test API Title Native');
        form.append('description', 'Testing');
        form.append('category', 'other');
        form.append('location', 'Library');
        form.append('user_id', 'guest');
        form.append('contact_email', 'test@test.com');

        output += "Sending POST request...\n";
        const res = await fetch('https://almost-perfect-lost-and-found.onrender.com/api/items/found', {
            method: 'POST',
            body: form
        });

        const txt = await res.text();
        output += `Status: ${res.status}\n`;
        output += `Response: ${txt}\n`;
    } catch (err) {
        output += `FETCH CRASH: ${err.message}\n`;
    } finally {
        fs.writeFileSync('fetch_out.txt', output);
        console.log("Done. Check fetch_out.txt");
    }
}
testLiveAPI();
