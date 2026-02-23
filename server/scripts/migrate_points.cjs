const path = require('path');
// Load env from one level up (server root)
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const { pool } = require('../db/db');

async function migrate() {
    const client = await pool.connect();
    try {
        console.log('Starting migration: Creating points_transactions table...');

        await client.query(`
            CREATE TABLE IF NOT EXISTS points_transactions (
                id SERIAL PRIMARY KEY,
                user_id TEXT REFERENCES users(user_id),
                points INTEGER DEFAULT 0,
                reason TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
        `);

        // Add index for performance
        await client.query(`
            CREATE INDEX IF NOT EXISTS idx_points_transactions_user_id ON points_transactions(user_id);
        `);

        console.log('Migration successful: points_transactions table created.');

        // Verify it exists
        const res = await client.query("SELECT to_regclass('public.points_transactions');");
        console.log('Table verification:', res.rows[0]);

    } catch (err) {
        console.error('Migration failed:', err);
    } finally {
        client.release();
        // Allow time for logs to flush before exit if needed, but pool.end() should handle it
        await pool.end();
    }
}

migrate();
