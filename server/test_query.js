const db = require('./db/db');

const sql = `
        SELECT * FROM (
            SELECT id, user_id, title, description, category, location, date_lost as date_reported, image_path, status, tags, contact_email, created_at, updated_at, 'lost' as type FROM lost_items
            UNION ALL
            SELECT id, user_id, title, description, category, location, date_found as date_reported, image_path, status, tags, contact_email, created_at, updated_at, 'found' as type FROM found_items
        ) AS all_items
        WHERE 1=1 AND (status = 'active' OR status = 'open' OR status = 'matched' OR status = 'claimed') ORDER BY created_at DESC
    `;

console.log("Running SQL...");
db.all(sql, [], (err, rows) => {
    if (err) {
        console.error("SQL Error encountered:", err);
    } else {
        console.log("Success, rows count:", rows ? rows.length : 0);
    }
    process.exit(0);
});
