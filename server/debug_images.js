const http = require('http');

function get(url) {
    return new Promise((resolve, reject) => {
        http.get(url, (res) => {
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => {
                try {
                    resolve(JSON.parse(data));
                } catch (e) {
                    console.log('Raw data:', data);
                    reject(e);
                }
            });
        }).on('error', reject);
    });
}

async function checkItems() {
    try {
        console.log('Fetching all items from http://localhost:3000/api/items...');
        // Fetch ALL items to finding one with an image
        const items = await get('http://localhost:3000/api/items');

        console.log(`Fetched ${items.length} items in total.`);

        const itemsWithImages = items.filter(i => i.imageUrl);
        console.log(`Found ${itemsWithImages.length} items with images.`);

        if (itemsWithImages.length === 0) {
            console.log("No items with images found in the database response.");
            return;
        }

        // Check the first 5 items with images
        itemsWithImages.slice(0, 5).forEach(item => {
            console.log(`\nItem ID: ${item.id}`);
            console.log(`Title: ${item.title}`);
            console.log(`Image URL: ${item.imageUrl}`);

            http.get(item.imageUrl, (res) => {
                console.log(`Image Status for ${item.id}: ${res.statusCode}`);
                if (res.statusCode !== 200) {
                    console.log(`WARNING: Image URL returned ${res.statusCode}`);
                }
            }).on('error', (e) => console.log(`Error fetching image for ${item.id}:`, e.message));
        });
    } catch (err) {
        console.error('Error:', err.message);
    }
}

checkItems();
