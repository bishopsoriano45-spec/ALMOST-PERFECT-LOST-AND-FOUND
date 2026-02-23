// Migration script to add missing columns to database
const { Pool } = require('pg');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

const pool = new Pool({
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 5432,
    database: process.env.DB_NAME || 'lost_found',
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD
});

async function runMigration() {
    const client = await pool.connect();
    try {
        console.log('Starting database migration...');

        // Add qr_code column to lost_items
        await client.query('ALTER TABLE lost_items ADD COLUMN IF NOT EXISTS qr_code TEXT');
        console.log('✓ Added qr_code column to lost_items');

        // Add updated_at column to lost_items
        await client.query('ALTER TABLE lost_items ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP');
        console.log('✓ Added updated_at column to lost_items');

        // Add qr_code column to found_items
        await client.query('ALTER TABLE found_items ADD COLUMN IF NOT EXISTS qr_code TEXT');
        console.log('✓ Added qr_code column to found_items');

        // Add updated_at column to found_items
        await client.query('ALTER TABLE found_items ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP');
        console.log('✓ Added updated_at column to found_items');

        // Update status constraint to include 'active'
        await client.query('ALTER TABLE lost_items DROP CONSTRAINT IF EXISTS lost_items_status_check');
        await client.query(`ALTER TABLE lost_items ADD CONSTRAINT lost_items_status_check 
            CHECK(status IN ('open', 'active', 'matched', 'claimed', 'closed'))`);
        console.log('✓ Updated lost_items status constraint');

        await client.query('ALTER TABLE found_items DROP CONSTRAINT IF EXISTS found_items_status_check');
        await client.query(`ALTER TABLE found_items ADD CONSTRAINT found_items_status_check 
            CHECK(status IN ('open', 'active', 'matched', 'claimed', 'closed'))`);
        console.log('✓ Updated found_items status constraint');

        console.log('\n✅ Migration completed successfully!');
    } catch (error) {
        console.error('❌ Migration failed:', error.message);
        process.exit(1);
    } finally {
        client.release();
        await pool.end();
    }
}

runMigration();
