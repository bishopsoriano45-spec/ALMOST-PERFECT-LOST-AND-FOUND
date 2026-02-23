const { Client } = require('pg');
require('dotenv').config();

async function createDatabase() {
    // Connect to 'postgres' database to create new db
    const client = new Client({
        host: process.env.DB_HOST || 'localhost',
        port: process.env.DB_PORT || 5432,
        user: process.env.DB_USER || 'postgres',
        password: process.env.DB_PASSWORD,
        database: 'postgres' // Connect to default db
    });

    try {
        await client.connect();
        console.log('Connected to postgres database');

        // Check if database exists
        const res = await client.query("SELECT 1 FROM pg_database WHERE datname = 'lostandfound'");
        if (res.rowCount === 0) {
            console.log("Database 'lostandfound' does not exist. Creating...");
            await client.query('CREATE DATABASE lostandfound');
            console.log("Database 'lostandfound' created successfully.");
        } else {
            console.log("Database 'lostandfound' already exists.");
        }
    } catch (err) {
        console.error('Error creating database:', err);
    } finally {
        await client.end();
    }
}

createDatabase();
