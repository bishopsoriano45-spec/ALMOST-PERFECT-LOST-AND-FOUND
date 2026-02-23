const { pool } = require('../db.js');

async function up() {
    const client = await pool.connect();
    try {
        console.log('Creating feedback table...');
        await client.query(`
            CREATE TABLE IF NOT EXISTS feedback (
                id SERIAL PRIMARY KEY,
                user_email TEXT,
                user_name TEXT,
                message TEXT NOT NULL,
                type TEXT CHECK(type IN ('complaint', 'suggestion', 'bug', 'other')) DEFAULT 'complaint',
                status TEXT CHECK(status IN ('new', 'read', 'resolved')) DEFAULT 'new',
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
        `);
        console.log('Feedback table created successfully.');
    } catch (error) {
        console.log('Error creating feedback table:', error.message);
        console.log(error.stack);
    } finally {
        client.release();
    }
}

up();
