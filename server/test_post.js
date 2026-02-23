const http = require('http');

const data = JSON.stringify({
    title: "Test Found Item",
    description: "Test description",
    category: "wallet",
    location: "Library",
    date_found: "2023-11-20T10:00:00.000Z",
    user_id: "guest",
    contact_email: "guest@example.com"
});

const options = {
    hostname: 'localhost',
    port: 3000,
    path: '/api/items/found',
    method: 'POST',
    headers: {
        'Content-Type': 'application/json',
        'Content-Length': data.length
    }
};

const req = http.request(options, res => {
    console.log(`STATUS: ${res.statusCode}`);
    res.on('data', d => {
        process.stdout.write(d);
    });
});

req.on('error', error => {
    console.error(error);
});

req.write(data);
req.end();
