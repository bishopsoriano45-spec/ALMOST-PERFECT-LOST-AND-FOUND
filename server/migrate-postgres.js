const { pool } = require('./db/db');
const fs = require('fs');
const path = require('path');

async function migrateToPostgreSQL() {
    const client = await pool.connect();

    try {
        console.log('Starting PostgreSQL migration...');

        // Read PostgreSQL schema from db folder
        const schemaPath = path.resolve(__dirname, 'db', 'schema-postgres.sql');
        const schema = fs.readFileSync(schemaPath, 'utf8');

        // Execute schema
        await client.query(schema);

        console.log('✅ PostgreSQL database schema created successfully!');
        console.log('\nTables created:');
        console.log('  - users');
        console.log('  - lost_items');
        console.log('  - found_items');
        console.log('  - claims');
        console.log('  - notifications');
        console.log('  - ai_logs');
        console.log('\nIndexes created for performance optimization.');

    } catch (error) {
        console.error('❌ Migration failed:', error.message);
        throw error;
    } finally {
        client.release();
        await pool.end();
    }
}

// Run migration
migrateToPostgreSQL()
    .then(() => {
        console.log('\n✅ Migration completed successfully!');
        process.exit(0);
    })
    .catch((error) => {
        console.error('\n❌ Migration failed:', error);
        process.exit(1);
    });
