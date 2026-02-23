const { pool } = require('./db/db');

async function checkUsers() {
    try {
        const res = await pool.query('SELECT user_id, email FROM users LIMIT 5');
        console.log('Valid Users:', res.rows);
    } catch (err) {
        console.error('Error checking users:', err);
    } finally {
        pool.end();
    }
}

checkUsers();
