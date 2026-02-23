const db = require('./db/db');

async function checkUsers() {
    try {
        const users = await new Promise((resolve, reject) => {
            db.all('SELECT * FROM users', [], (err, rows) => {
                if (err) reject(err);
                else resolve(rows);
            });
        });

        console.log('Users found:', users.length);
        if (users.length > 0) {
            console.log('Sample user:', users[0]);
        } else {
            console.log('No users found in database.');
        }
    } catch (error) {
        console.error('Error querying users:', error);
    }
}

checkUsers();
