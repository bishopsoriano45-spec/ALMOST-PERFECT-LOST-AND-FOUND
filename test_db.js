const db = require('./server/db/db');

const sql = `
        SELECT * FROM (
            SELECT id, user_id, title, description, category, location, date_lost as date_reported, image_path, status, tags, contact_email, created_at, updated_at, 'lost' as type FROM lost_items
            UNION ALL
            SELECT id, user_id, title, description, category, location, date_found as date_reported, image_path, status, tags, contact_email, created_at, updated_at, 'found' as type FROM found_items
        ) AS all_items
        WHERE 1=1 AND (status = 'active' OR status = 'open' OR status = 'matched' OR status = 'claimed') ORDER BY created_at DESC
    `;

db.all(sql, [], (err, rows) => {
    if (err) {
        console.error("Query Error:", err);
    } else {
        console.log("Success! Returned rows:", rows?.length);
    }
    process.exit(0);
});
