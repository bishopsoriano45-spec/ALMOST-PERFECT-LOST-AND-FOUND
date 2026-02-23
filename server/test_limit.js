const fs = require('fs');
const path = require('path');
const http = require('http');
const FormData = require('form-data');

// Create a large dummy file > 5MB
const LARGE_FILE_PATH = path.join(__dirname, 'large_test_file.jpg');
const buffer = Buffer.alloc(6 * 1024 * 1024); // 6MB
fs.writeFileSync(LARGE_FILE_PATH, buffer);

function uploadLargeFile() {
    return new Promise((resolve, reject) => {
        const form = new FormData();
        form.append('title', 'Large File Test');
        form.append('description', 'Testing upload limit');
        form.append('category', 'electronics');
        form.append('location', 'Test Lab');
        form.append('date_lost', new Date().toISOString());
        form.append('user_id', 'guest');
        form.append('image', fs.createReadStream(LARGE_FILE_PATH));

        const options = {
            method: 'POST',
            host: 'localhost',
            port: 3000,
            path: '/api/items/lost',
            headers: form.getHeaders()
        };

        const req = http.request(options, (res) => {
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => {
                // Cleanup
                fs.unlinkSync(LARGE_FILE_PATH);

                if (res.statusCode === 500) { // Multer error often returns 500 or we catch it
                    console.log('Response:', data);
                    resolve({ status: res.statusCode, data });
                } else {
                    resolve({ status: res.statusCode, data });
                }
            });
        });

        req.on('error', (err) => {
            fs.unlinkSync(LARGE_FILE_PATH);
            reject(err);
        });
        form.pipe(req);
    });
}

uploadLargeFile().then(result => {
    console.log('Upload Result Status:', result.status);
    if (result.data.includes('File too large') || result.status !== 201) {
        console.log('✅ Large file correctly rejected/handled.');
    } else {
        console.error('❌ Large file was accepted unexpectedly.');
    }
}).catch(console.error);
