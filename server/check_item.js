const { pool } = require('./db/db');

async function checkItems() {
    try {
        console.log('🔍 Checking lost_items table...');
        // Try to get ANY item
        const res = await pool.query('SELECT id FROM lost_items LIMIT 1');

        if (res.rows.length > 0) {
            console.log(`✅ Found item with ID: ${res.rows[0].id}`);
            return res.rows[0].id;
        } else {
            console.log('⚠️ No items found. Creating dummy item...');
            // Insert dummy item
            // Need to know schema of lost_items. Assuming basic fields based on earlier types.
            // But wait, server/db/migrations might show schema.
            // Let's try a minimal insert if possible, or print schema error if it fails.

            const insertRes = await pool.query(`
                INSERT INTO lost_items (title, description, category, date_lost, user_id, status)
                VALUES ('Test Phone', 'Lost during verification', 'electronics', NOW(), 'test_user', 'active')
                RETURNING id
            `);
            console.log(`✅ Created dummy item with ID: ${insertRes.rows[0].id}`);
            return insertRes.rows[0].id;
        }
    } catch (err) {
        console.error('❌ Error checking/creating item:', err);
        // Maybe table is named 'items' and not 'lost_items'?
        // Let's list tables.
        const tables = await pool.query("SELECT table_name FROM information_schema.tables WHERE table_schema='public'");
        console.log('Tables:', tables.rows.map(r => r.table_name));
    } finally {
        pool.end();
    }
}

checkItems();
