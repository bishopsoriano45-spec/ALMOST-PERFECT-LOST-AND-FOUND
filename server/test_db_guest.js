const { pool } = require('./db/db');

async function testGuestInsert() {
    const client = await pool.connect();
    try {
        console.log('Attempting to insert guest user...');
        const res = await client.query(`INSERT INTO users (user_id, email) VALUES ($1, $2) ON CONFLICT (user_id) DO NOTHING RETURNING *`, ['guest', 'guest@example.com']);
        console.log('Insert Response Rows:', res.rows);

        const verify = await client.query(`SELECT * FROM users WHERE user_id = 'guest'`);
        console.log('Verify row exists:', verify.rows);
    } catch (e) {
        console.error('CRASH:', e.message);
    } finally {
        client.release();
        process.exit();
    }
}
testGuestInsert();
