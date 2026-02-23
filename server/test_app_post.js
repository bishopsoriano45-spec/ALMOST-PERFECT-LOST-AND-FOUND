const express = require('express');
const itemsRouter = require('./routes/items');
const multer = require('multer');

// Mock out supabase storage to test without actual network
const sb = require('./lib/supabaseStorage');
sb.uploadImage = async () => 'http://example.com/test.jpg';

const app = express();
app.use(express.json());
app.use('/api/items', itemsRouter);

const server = app.listen(3001, async () => {
    console.log('Test server started on 3001');
    const axios = require('axios');
    try {
        const res = await axios.post('http://localhost:3001/api/items/found', {
            title: 'Test Local',
            description: 'Testing',
            category: 'wallet',
            location: 'Localhost',
            date_found: new Date().toISOString(),
            user_id: 'guest',
            contact_email: 'guest@example.com'
        });
        console.log('SUCCESS:', res.status, res.data);
    } catch (e) {
        console.error('SERVER RESPONDED WITH ERROR:');
        console.error(e.response ? e.response.status : e.message);
        console.error(e.response ? e.response.data : '');
    }
    server.close();
    process.exit(0);
});
