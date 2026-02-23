const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });
const { pool } = require('./db/db');
const fs = require('fs');

async function migrateAutoLearning() {
    const client = await pool.connect();

    try {
        console.log('Starting Auto-Learning Schema Migration...');

        // Read PostgreSQL schema from migrations folder
        const schemaPath = path.resolve(__dirname, 'migrations', '001_auto_learning_schema.sql');
        const schema = fs.readFileSync(schemaPath, 'utf8');

        // Execute schema
        await client.query(schema);

        console.log('✅ Auto-Learning schema applied successfully!');
        console.log('\nTables created/verified:');
        console.log('  - ai_feedback');
        console.log('  - model_versions');
        console.log('  - background_jobs');

    } catch (error) {
        console.error('❌ Migration failed:', error.message);
        throw error;
    } finally {
        client.release();
        await pool.end();
    }
}

// Run migration
migrateAutoLearning()
    .then(() => {
        console.log('\n✅ Migration script finished.');
        process.exit(0);
    })
    .catch((error) => {
        console.error('\n❌ Migration script failed:', error);
        process.exit(1);
    });
