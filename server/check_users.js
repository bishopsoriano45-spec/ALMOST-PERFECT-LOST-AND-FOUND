const db = require('./db/db');

const sql = `SELECT * FROM users`;

db.all(sql, [], (err, rows) => {
    if (err) {
        console.error('Error fetching users:', err);
        return;
    }
    console.log('Users found:', rows.length);
    console.log(rows);
});
