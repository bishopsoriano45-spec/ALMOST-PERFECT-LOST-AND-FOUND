const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });

console.log('DB_HOST:', process.env.DB_HOST);
console.log('DB_USER:', process.env.DB_USER);
console.log('DB_PASSWORD type:', typeof process.env.DB_PASSWORD);
console.log('DB_PASSWORD length:', process.env.DB_PASSWORD ? process.env.DB_PASSWORD.length : 0);

const db = require('./db/db');

async function testConnection() {
    try {
        await db.query('SELECT NOW()');
        console.log('Connection successful');
    } catch (err) {
        console.error('Connection failed:', err);
    }
}

testConnection();
