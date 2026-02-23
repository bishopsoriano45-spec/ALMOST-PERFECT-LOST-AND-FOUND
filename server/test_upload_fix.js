const axios = require('axios');
const fs = require('fs');
const FormData = require('form-data');
const path = require('path');

async function testUpload() {
    try {
        // 0. Get a valid user
        console.log('Fetching users...');
        let userId = '1'; // Fallback
        try {
            const usersRes = await axios.get('http://localhost:3000/api/users'); // Assuming this exists or similar
            // If this fails, we will try to just use '1' or 'guest' if we think it exists.
            // Actually, let's just try to create a user if we can't find one? 
            // Or assume 'user1' or something. 
            if (usersRes.data && usersRes.data.length > 0) {
                userId = usersRes.data[0].id || usersRes.data[0].user_id;
                console.log(`Using existing user: ${userId}`);
            } else {
                console.log("No users found. Trying 'guest' or '1'");
                userId = 'guest';
            }
        } catch (e) {
            console.log("Could not fetch users. Trying 'guest'");
            userId = 'guest';
        }


        // 1. Find a file to upload
        const uploadsDir = path.join(__dirname, 'uploads');
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
        form.append('title', 'Test Upload Fix');
        form.append('description', 'Testing if image URL is fixed');
        form.append('category', 'Electronics');
        form.append('location', 'Test Lab');
        form.append('date_found', new Date().toISOString());
        form.append('user_id', userId); // Use valid user
        form.append('image', fs.createReadStream(filePath));

        // 3. Send POST request
        console.log(`Sending POST to http://localhost:3000/api/items/found with user_id=${userId}...`);
        const response = await axios.post('http://localhost:3000/api/items/found', form, {
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
            if (item.imageUrl.includes('C:') || item.imageUrl.includes('Users')) {
                console.error('FAIL: Rogers! We have a leak! Absolute path detected in URL.');
            }
        } else {
            console.error(`FAIL: imageUrl format is unexpected: ${item.imageUrl}`);
        }

    } catch (error) {
        console.error('Error testing upload:', error.message);
        if (error.response) {
            console.error('Response status:', error.response.status);
            console.error('Response data:', error.response.data);
        }
    }
}

testUpload();
