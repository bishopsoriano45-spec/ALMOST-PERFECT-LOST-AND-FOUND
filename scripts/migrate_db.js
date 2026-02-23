const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.resolve(__dirname, '../server/lost_found.db');
const db = new sqlite3.Database(dbPath);

const runMigration = () => {
    console.log('Running migration...');

    db.serialize(() => {
        // Add columns to lost_items
        db.run("ALTER TABLE lost_items ADD COLUMN tags TEXT", (err) => {
            if (err && !err.message.includes('duplicate column')) console.error('Error adding tags to lost_items:', err.message);
            else console.log('Added tags to lost_items');
        });
        db.run("ALTER TABLE lost_items ADD COLUMN embedding TEXT", (err) => {
            if (err && !err.message.includes('duplicate column')) console.error('Error adding embedding to lost_items:', err.message);
            else console.log('Added embedding to lost_items');
        });

        // Add columns to found_items
        db.run("ALTER TABLE found_items ADD COLUMN tags TEXT", (err) => {
            if (err && !err.message.includes('duplicate column')) console.error('Error adding tags to found_items:', err.message);
            else console.log('Added tags to found_items');
        });
        db.run("ALTER TABLE found_items ADD COLUMN embedding TEXT", (err) => {
            if (err && !err.message.includes('duplicate column')) console.error('Error adding embedding to found_items:', err.message);
            else console.log('Added embedding to found_items');
        });
    });

    db.close((err) => {
        if (err) console.error(err.message);
        console.log('Migration completed.');
    });
};

runMigration();
