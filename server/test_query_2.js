const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });
const { Pool } = require('pg');

const pool = new Pool({
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 5432,
    database: process.env.DB_NAME || 'lost_found',
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD,
    max: 20,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 2000,
});

function convertPlaceholders(sql) {
    let index = 1;
    return sql.replace(/\?/g, () => `$${index++}`);
}

const sql_query = `
        SELECT * FROM (
            SELECT id, user_id, title, description, category, location, date_lost as date_reported, image_path, status, tags, contact_email, created_at, updated_at, 'lost' as type FROM lost_items
            UNION ALL
            SELECT id, user_id, title, description, category, location, date_found as date_reported, image_path, status, tags, contact_email, created_at, updated_at, 'found' as type FROM found_items
        ) AS all_items
        WHERE 1=1 ORDER BY created_at DESC
    `;

pool.query(convertPlaceholders(sql_query), [], (err, result) => {
    let output = '';
    if (err) {
        output = "SQL ERROR: " + String(err);
    } else {
        output = "SUCCESS, " + result.rows.length + " rows returned.";
    }
    fs.writeFileSync('query_out.txt', output);
    process.exit(0);
});
