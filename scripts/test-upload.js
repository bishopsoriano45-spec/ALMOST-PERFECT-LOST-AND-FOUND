const FormData = require('form-data');
const fs = require('fs');
const axios = require('axios');
const path = require('path');

async function testUpload() {
    try {
        console.log('Testing upload functionality...\n');

        // Test Lost Item Upload
        const imagePath = path.join(__dirname, 'server', 'sample_images', 'sample1.jpg');

        if (!fs.existsSync(imagePath)) {
            console.error('Sample image not found:', imagePath);
            return;
        }

        const formData = new FormData();
        formData.append('image', fs.createReadStream(imagePath));
        formData.append('title', 'Test Upload - Fixed Path');
        formData.append('description', 'Testing upload with absolute path configuration');
        formData.append('category', 'Electronics');
        formData.append('location', 'Test Location');
        formData.append('user_id', 'test_user');

        console.log('Uploading lost item...');
        const response = await axios.post('http://localhost:3000/api/items/lost', formData, {
            headers: formData.getHeaders()
        });

        console.log('✓ Upload successful!');
        console.log('Response:', JSON.stringify(response.data, null, 2));

        // Verify the file was saved
        const uploadsDir = path.join(__dirname, 'server', 'uploads');
        const files = fs.readdirSync(uploadsDir);
        console.log(`\n✓ Uploads directory contains ${files.length} files`);

    } catch (error) {
        console.error('✗ Upload failed:');
        if (error.response) {
            console.error('Status:', error.response.status);
            console.error('Data:', error.response.data);
        } else {
            console.error(error.message);
        }
    }
}

testUpload();
