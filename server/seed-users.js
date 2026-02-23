const { pool } = require('./db/db');
require('dotenv').config();

async function seedUsers() {
    const client = await pool.connect();
    try {
        console.log('Seeding users...');

        // Create a test user
        const userId = 'user_test_123';
        const email = process.env.EMAIL_USER; // Use the configured email for testing

        // Upsert user
        const query = `
            INSERT INTO users (user_id, email, role)
            VALUES ($1, $2, 'user')
            ON CONFLICT (user_id) 
            DO UPDATE SET email = $2
            RETURNING *
        `;

        const res = await client.query(query, [userId, email]);
        console.log('Seeded user:', res.rows[0]);

        // Create another user (finder)
        const finderId = 'user_finder_456';
        const finderEmail = 'finder@example.com';

        await client.query(`
            INSERT INTO users (user_id, email, role)
            VALUES ($1, $2, 'user')
            ON CONFLICT (user_id) 
            DO NOTHING
        `, [finderId, finderEmail]);
        console.log('Seeded finder user');

    } catch (err) {
        console.error('Error seeding users:', err);
    } finally {
        client.release();
        await pool.end();
    }
}

seedUsers();
