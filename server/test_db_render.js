const { Pool } = require('pg');
const fs = require('fs');

const pool = new Pool({
    host: 'dpg-cuseucl2ng1s73db3250-a.singapore-postgres.render.com',
    port: 5432,
    database: 'almost_perfect_db',
    user: 'almost_perfect_db_user',
    password: 'K5GzC2ZNRr6mJ31YnF22mE6iE512R33o',
    ssl: { rejectUnauthorized: false }
});

let output = 'Starting execution...\n';

pool.connect()
    .then(client => {
        output += 'Connected to pool.\n';
        return client.query(`INSERT INTO users (user_id, email) VALUES ($1, $2) ON CONFLICT (user_id) DO NOTHING RETURNING *`, ['guest', 'guest@example.com'])
            .then(res => {
                output += 'Insert Response Rows: ' + JSON.stringify(res.rows) + '\n';
                return client.query(`SELECT * FROM users WHERE user_id = 'guest'`);
            })
            .then(verify => {
                output += 'Verify row exists: ' + JSON.stringify(verify.rows) + '\n';
            })
            .catch(e => {
                output += 'CRASH: ' + e.message + '\n';
            })
            .finally(() => {
                client.release();
                fs.writeFileSync('db_out.txt', output);
                console.log('Finished writing to db_out.txt');
                process.exit(0);
            });
    })
    .catch(err => {
        output += 'CONNECTION ERROR: ' + err.message + '\n';
        fs.writeFileSync('db_out.txt', output);
        console.log('Finished writing connection error to db_out.txt');
        process.exit(1);
    });
