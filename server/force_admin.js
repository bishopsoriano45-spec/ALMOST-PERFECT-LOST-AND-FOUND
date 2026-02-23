const { Pool } = require('pg');
const crypto = require('crypto');

const pool = new Pool({
    host: 'dpg-cuseucl2ng1s73db3250-a.singapore-postgres.render.com',
    port: 5432,
    database: 'almost_perfect_db',
    user: 'almost_perfect_db_user',
    password: 'K5GzC2ZNRr6mJ31YnF22mE6iE512R33o',
    ssl: { rejectUnauthorized: false }
});

const hashPassword = (password) => {
    return crypto.createHash('sha256').update(password).digest('hex');
};

async function forceCreateAdmin() {
    const client = await pool.connect();
    try {
        console.log('Inserting default admin...');
        const email = 'admin@almostperfect.com';
        const rawPassword = 'admin';
        const hashedPass = hashPassword(rawPassword);

        await client.query(`
            INSERT INTO users (user_id, email, role, points, password_hash)
            VALUES ('admin_sys', $1, 'admin', 0, $2)
            ON CONFLICT (user_id) DO UPDATE SET password_hash = $2
        `, [email, hashedPass]);

        console.log('SUCCESS! Admin Credentials:');
        console.log('Email:', email);
        console.log('Password:', rawPassword);
    } catch (err) {
        console.error('CRASH:', err.message);
    } finally {
        client.release();
        process.exit();
    }
}
forceCreateAdmin();
