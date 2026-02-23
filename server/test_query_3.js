const { Pool } = require('pg');

const pool = new Pool({
    host: 'aws-1-ap-southeast-2.pooler.supabase.com',
    port: 6543,
    database: 'postgres',
    user: 'postgres.rptmtxxpqiaatzlcwwpv',
    password: 'YzwGUyqbTtn2Wm4r'
});

async function run() {
    try {
        await pool.query(`
      INSERT INTO users (id, name, email, password, role) 
      VALUES ('guest', 'Guest User', 'guest@example.com', 'none', 'user') 
      ON CONFLICT (id) DO NOTHING
    `);
        console.log('Guest user inserted or already exists');

        const res = await pool.query("SELECT * FROM users WHERE id = 'guest'");
        console.log(res.rows);
    } catch (err) {
        console.error(err);
    } finally {
        await pool.end();
    }
}

run();
