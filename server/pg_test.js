const { Pool } = require('pg');
const pool = new Pool({ connectionString: 'postgres://invalid:invalid@localhost/invalid' });

try {
    pool.query('SELECT $1', [undefined], (err, res) => {
        console.log("FROM CALLBACK:", err ? err.message : 'success');
    });
} catch (e) {
    console.log("SYNC THROW:", e.message);
}
