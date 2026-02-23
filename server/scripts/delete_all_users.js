/**
 * Script to remove all users from the database
 * Run with: node server/scripts/delete_all_users.js
 */

const { Pool } = require('pg');
require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });

const pool = new Pool({
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 5432,
    database: process.env.DB_NAME || 'lost_found',
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || 'password'
});

async function deleteAllUsers() {
    try {
        // First, check current users
        const before = await pool.query('SELECT * FROM users');
        console.log(`Found ${before.rows.length} users before deletion:`);
        before.rows.forEach(u => console.log(`  - ${u.user_id} (${u.role})`));

        // Delete ALL users (including admin if you want)
        await pool.query("DELETE FROM users");

        // Verify deletion
        const after = await pool.query('SELECT * FROM users');
        console.log(`\n✅ Deleted all users. Remaining: ${after.rows.length}`);

    } catch (error) {
        console.error('Error:', error.message);
    } finally {
        await pool.end();
    }
}

deleteAllUsers();
