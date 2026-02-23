const { pool } = require('./db/db');
const fs = require('fs');
const path = require('path');

async function runMigration() {
    const client = await pool.connect();

    try {
        console.log('Starting migration to add missing columns...');

        const migrationPath = path.resolve(__dirname, 'db', 'migration_add_missing_columns.sql');

        if (!fs.existsSync(migrationPath)) {
            throw new Error(`Migration file not found at ${migrationPath}`);
        }

        const migrationSql = fs.readFileSync(migrationPath, 'utf8');

        console.log('Executing SQL...');
        await client.query(migrationSql);

        console.log('✅ Migration executed successfully!');

    } catch (error) {
        console.error('❌ Migration failed:', error.message);
        process.exit(1);
    } finally {
        client.release();
        await pool.end();
    }
}

runMigration();
