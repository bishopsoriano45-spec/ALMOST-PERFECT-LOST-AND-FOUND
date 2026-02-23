const { pool } = require('./db/db');

async function testConnection() {
    console.log('Testing PostgreSQL connection...\n');

    try {
        // Test basic connection
        const result = await pool.query('SELECT NOW() as current_time, version() as pg_version');

        console.log('✅ PostgreSQL Connection Successful!');
        console.log('\nDatabase Info:');
        console.log(`  Time: ${result.rows[0].current_time}`);
        console.log(`  Version: ${result.rows[0].pg_version.split(',')[0]}`);

        // Check if tables exist
        const tablesResult = await pool.query(`
            SELECT table_name 
            FROM information_schema.tables 
            WHERE table_schema = 'public'
            ORDER BY table_name
        `);

        if (tablesResult.rows.length > 0) {
            console.log('\n✅ Tables found:');
            tablesResult.rows.forEach(row => {
                console.log(`  - ${row.table_name}`);
            });
        } else {
            console.log('\n⚠️  No tables found. Run migration:');
            console.log('  node migrate-postgres.js');
        }

    } catch (error) {
        console.error('❌ Connection failed:', error.message);
        console.log('\nTroubleshooting:');
        console.log('1. Make sure PostgreSQL is installed and running');
        console.log('2. Create database: psql -U postgres -c "CREATE DATABASE lost_found"');
        console.log('3. Check .env file has correct credentials');
        console.log('4. Verify password: 10232003');
    } finally {
        await pool.end();
    }
}

testConnection();
