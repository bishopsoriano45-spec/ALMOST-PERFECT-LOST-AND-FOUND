const path = require('path');
require('dotenv').config({ path: path.join(__dirname, 'server', '.env') });
const { pool } = require('./server/db/db');

async function listSchema() {
    try {
        const client = await pool.connect();

        // List Tables
        const tablesRes = await client.query(`
            SELECT table_name 
            FROM information_schema.tables 
            WHERE table_schema = 'public'
        `);

        console.log('=== TABLES ===');
        const tables = tablesRes.rows.map(row => row.table_name);
        console.log(tables);

        // Describe key tables
        for (const table of tables) {
            console.log(`\n=== SCHEMA: ${table} ===`);
            const colsRes = await client.query(`
                SELECT column_name, data_type 
                FROM information_schema.columns 
                WHERE table_name = '${table}'
            `);
            colsRes.rows.forEach(row => {
                console.log(`- ${row.column_name} (${row.data_type})`);
            });
        }

        client.release();
    } catch (err) {
        console.error(err);
    } finally {
        pool.end();
    }
}

listSchema();
