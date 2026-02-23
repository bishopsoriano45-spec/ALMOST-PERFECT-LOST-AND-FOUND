// Script to add guest user to database
require('dotenv').config({ path: require('path').resolve(__dirname, '.env') });
const db = require('./db/db');

async function addGuestUser() {
    try {
        console.log('Adding guest user to database...');

        // Check if guest user exists
        const result = await db.query(
            `SELECT * FROM users WHERE user_id = $1`,
            ['guest']
        );

        if (result.rows.length > 0) {
            console.log('Guest user already exists:', result.rows[0]);
        } else {
            // Create guest user
            await db.query(
                `INSERT INTO users (user_id, name, email) VALUES ($1, $2, $3)`,
                ['guest', 'Guest User', 'guest@example.com']
            );
            console.log('Guest user created successfully!');
        }

        process.exit(0);
    } catch (error) {
        console.error('Error:', error.message);
        process.exit(1);
    }
}

addGuestUser();
