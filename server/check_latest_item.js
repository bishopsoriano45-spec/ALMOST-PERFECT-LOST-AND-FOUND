const db = require('./db/db');

function mapDbRowToItem(row) {
    if (!row) return null;
    return {
        id: row.id,
        title: row.title,
        image_path: row.image_path,
        imageUrl: (() => {
            if (!row.image_path) return null;
            const normalizedPath = row.image_path.replace(/\\/g, '/');
            const uploadsIndex = normalizedPath.indexOf('uploads/');
            const filename = uploadsIndex !== -1
                ? normalizedPath.substring(uploadsIndex + 8)
                : normalizedPath.split('/').pop();
            return `http://localhost:3000/uploads/${filename}`;
        })()
    };
}

db.all('SELECT id, title, image_path FROM lost_items ORDER BY id DESC LIMIT 1', [], (err, rows) => {
    if (err) return console.error(err);
    console.log('--- Latest Lost Item ---');
    console.log(rows[0]);
    console.log('Mapped:', mapDbRowToItem(rows[0]));
});

db.all('SELECT id, title, image_path FROM found_items ORDER BY id DESC LIMIT 1', [], (err, rows) => {
    if (err) return console.error(err);
    console.log('\n--- Latest Found Item ---');
    console.log(rows[0]);
    console.log('Mapped:', mapDbRowToItem(rows[0]));
});
