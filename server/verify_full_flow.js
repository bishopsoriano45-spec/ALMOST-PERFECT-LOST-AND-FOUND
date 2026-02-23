const fs = require('fs');
const path = require('path');
const http = require('http');
const FormData = require('form-data');

// Configuration
const BASE_URL = 'http://localhost:3000/api';
const TEST_IMAGE_PATH = path.join(__dirname, 'test_debug.jpg');

// Ensure test image exists
if (!fs.existsSync(TEST_IMAGE_PATH)) {
    console.error('Test image not found at:', TEST_IMAGE_PATH);
    // Create a dummy image if needed or exit
    fs.writeFileSync(TEST_IMAGE_PATH, 'dummy image content');
}

function uploadItem(type) {
    return new Promise((resolve, reject) => {
        const form = new FormData();
        form.append('title', `Test ${type} Item E2E`);
        form.append('description', 'This is a test item for E2E verification');
        form.append('category', 'electronics');
        form.append('location', 'Test Lab');
        form.append('date_' + type, new Date().toISOString());
        form.append('user_id', 'guest');
        form.append('image', fs.createReadStream(TEST_IMAGE_PATH));

        const options = {
            method: 'POST',
            host: 'localhost',
            port: 3000,
            path: `/api/items/${type}`,
            headers: form.getHeaders()
        };

        const req = http.request(options, (res) => {
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => {
                if (res.statusCode >= 200 && res.statusCode < 300) {
                    try {
                        const parsed = JSON.parse(data);
                        resolve(parsed);
                    } catch (e) {
                        reject(new Error(`Failed to parse response: ${data}`));
                    }
                } else {
                    reject(new Error(`Upload failed with status ${res.statusCode}: ${data}`));
                }
            });
        });

        req.on('error', reject);
        form.pipe(req);
    });
}

function fetchItems() {
    return new Promise((resolve, reject) => {
        http.get(`${BASE_URL}/items`, (res) => {
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => {
                if (res.statusCode === 200) {
                    try {
                        const items = JSON.parse(data);
                        resolve(items);
                    } catch (e) {
                        reject(new Error('Failed to parse fetch response'));
                    }
                } else {
                    reject(new Error(`Fetch failed with status ${res.statusCode}`));
                }
            });
        }).on('error', reject);
    });
}

async function runVerification() {
    console.log('--- Starting End-to-End Verification ---');

    try {
        // 1. Upload Lost Item
        console.log('1. Uploading Lost Item...');
        const lostItem = await uploadItem('lost');
        console.log('   ✅ Upload Successful. ID:', lostItem.id);
        console.log('   📸 Image URL:', lostItem.imageUrl);

        if (!lostItem.imageUrl || !lostItem.imageUrl.includes('/uploads/')) {
            throw new Error('Image URL is missing or malformed');
        }

        // 2. Fetch All Items
        console.log('2. Fetching All Items...');
        const items = await fetchItems();
        console.log(`   ✅ Fetched ${items.length} items`);

        // 3. Verify Item exists in list
        const foundInList = items.find(i => i.id === lostItem.id);
        if (foundInList) {
            console.log('   ✅ Newly created item found in list');
            console.log('   🔍 List Item Image URL:', foundInList.imageUrl);

            if (foundInList.imageUrl === lostItem.imageUrl) {
                console.log('   ✅ Image URLs match');
            } else {
                console.error('   ❌ Image URL mismatch');
            }
        } else {
            console.error('   ❌ Item NOT found in list');
        }

        console.log('--- Verification Complete: SUCCESS ---');

    } catch (error) {
        console.error('--- Verification FAILED ---');
        console.error(error.message);
        process.exit(1);
    }
}

runVerification();
