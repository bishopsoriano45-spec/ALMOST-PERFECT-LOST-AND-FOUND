const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../server/.env') });
const { pool } = require('../server/db/db');

async function verifySchema() {
    console.log("Connecting to DB...");
    const client = await pool.connect();
    try {
        console.log("Checking 'users' table columns...");
        const res = await client.query(`
            SELECT column_name 
            FROM information_schema.columns 
            WHERE table_name = 'users';
        `);

        const columns = res.rows.map(r => r.column_name);
        console.log("Users Columns:", columns);

        if (columns.includes('points')) {
            console.log("✅ 'points' column exists.");
        } else {
            console.error("❌ 'points' column MISSING!");
        }

        console.log("Checking 'claims' table...");
        const claimsRes = await client.query(`
            SELECT to_regclass('public.claims');
        `);

        if (claimsRes.rows[0].to_regclass) {
            console.log("✅ 'claims' table exists.");
        } else {
            console.error("❌ 'claims' table MISSING!");
        }

    } catch (err) {
        console.error("Error verifying schema:", err);
    } finally {
        client.release();
        pool.end();
    }
}

verifySchema();
