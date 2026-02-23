const db = require('./db/db');

async function checkSchema() {
    console.log('🔍 Checking Users Table Schema...');
    try {
        const res = await db.query(`
            SELECT column_name, data_type 
            FROM information_schema.columns 
            WHERE table_name = 'users';
        `);
        const columns = res.rows.map(r => r.column_name);
        console.log(JSON.stringify(columns, null, 2));
    } catch (error) {
        console.error('Error:', error);
    } finally {
        process.exit();
    }
}

checkSchema();
