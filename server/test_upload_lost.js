const axios = require('axios');
const fs = require('fs');
const FormData = require('form-data');
const path = require('path');

async function testUploadLost() {
    try {
        console.log('Fetching users...');
        let userId = 'guest';

        // 1. Find a file to upload
        const uploadsDir = path.join(__dirname, 'uploads');
        if (!fs.existsSync(uploadsDir)) {
            console.log('Uploads dir not found');
            return;
        }
        const files = fs.readdirSync(uploadsDir);
        const imageFile = files.find(f => f.endsWith('.jpg') || f.endsWith('.png'));

        if (!imageFile) {
            console.log('No image found in uploads directory to use for test.');
            return;
        }

        const filePath = path.join(uploadsDir, imageFile);
        console.log(`Using file for test: ${filePath}`);

        // 2. Prepare FormData
        const form = new FormData();
        form.append('title', 'Test Lost Item Upload');
        form.append('description', 'Testing lost item image upload');
        form.append('category', 'Electronics');
        form.append('location', 'Test Lab');
        form.append('date_lost', new Date().toISOString()); // Note: date_lost
        form.append('user_id', userId);
        form.append('contact_email', 'test@example.com');
        form.append('image', fs.createReadStream(filePath));

        // 3. Send POST request
        console.log(`Sending POST to http://localhost:3000/api/items/lost...`);
        const response = await axios.post('http://localhost:3000/api/items/lost', form, {
            headers: {
                ...form.getHeaders()
            }
        });

        // 4. Inspect Response
        const item = response.data;
        console.log('\n--- Response Data ---');
        console.log(`Item ID: ${item.id}`);
        console.log(`Image URL: ${item.imageUrl}`);

        if (!item.imageUrl) {
            console.error('FAIL: imageUrl is null or missing.');
        } else if (item.imageUrl.startsWith('http://localhost:3000/uploads/')) {
            console.log('PASS: imageUrl has correct format.');
        } else {
            console.error(`FAIL: imageUrl format is unexpected: ${item.imageUrl}`);
        }

    } catch (error) {
        console.error('Error testing upload:', error.message);
        if (error.response) {
            console.log('Data:', error.response.data);
        }
    }
}

testUploadLost();
