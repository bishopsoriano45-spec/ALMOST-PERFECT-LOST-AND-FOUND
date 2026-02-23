const { pool } = require('./db/db');

async function seedGuestUser() {
    const client = await pool.connect();
    try {
        console.log('Seeding guest user...');

        const guestId = 'guest';
        const guestEmail = 'guest@example.com';

        const query = `
            INSERT INTO users (user_id, email, role)
            VALUES ($1, $2, 'user')
            ON CONFLICT (user_id) 
            DO NOTHING
            RETURNING *
        `;

        const res = await client.query(query, [guestId, guestEmail]);
        if (res.rows.length > 0) {
            console.log('✅ Created guest user.');
        } else {
            console.log('ℹ️ Guest user already exists.');
        }

    } catch (err) {
        console.error('❌ Error seeding guest user:', err);
    } finally {
        client.release();
        await pool.end();
    }
}

seedGuestUser();
