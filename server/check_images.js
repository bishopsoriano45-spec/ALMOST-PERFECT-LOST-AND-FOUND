const db = require('./db/db');

async function checkImages() {
    console.log('--- Checking Database Content ---');

    db.get('SELECT count(*) as count FROM lost_items', [], (err, row) => {
        if (err) console.error(err);
        else console.log('Total Lost Items:', row.count);
    });

    db.get('SELECT count(*) as count FROM found_items', [], (err, row) => {
        if (err) console.error(err);
        else console.log('Total Found Items:', row.count);
    });

    db.get('SELECT count(*) as count FROM lost_items WHERE image_path IS NOT NULL', [], (err, row) => {
        if (err) console.error(err);
        else console.log('Lost Items with Images:', row.count);
    });

    db.get('SELECT count(*) as count FROM found_items WHERE image_path IS NOT NULL', [], (err, row) => {
        if (err) console.error(err);
        else console.log('Found Items with Images:', row.count);
    });

    // Wait a bit for async queries
    setTimeout(() => {
        console.log('--- Details for Lost Items with Images ---');
        db.all('SELECT id, title, image_path FROM lost_items WHERE image_path IS NOT NULL LIMIT 5', [], (err, rows) => {
            if (err) console.error(err);
            else if (rows) rows.forEach(r => console.log('Lost:', r));
        });

        console.log('--- Details for Found Items with Images ---');
        db.all('SELECT id, title, image_path FROM found_items WHERE image_path IS NOT NULL LIMIT 5', [], (err, rows) => {
            if (err) console.error(err);
            else if (rows) rows.forEach(r => console.log('Found:', r));
        });
    }, 1000);
}

checkImages();
