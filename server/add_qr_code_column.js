const db = require('./db/db');

console.log('Adding qr_code column to database tables...');

db.run('ALTER TABLE lost_items ADD COLUMN qr_code TEXT', (err) => {
    if (err) {
        if (err.message.includes('duplicate')) {
            console.log('qr_code column already exists in lost_items');
        } else {
            console.error('Error adding qr_code to lost_items:', err.message);
        }
    } else {
        console.log('✓ Added qr_code column to lost_items');
    }
});

db.run('ALTER TABLE found_items ADD COLUMN qr_code TEXT', (err) => {
    if (err) {
        if (err.message.includes('duplicate')) {
            console.log('qr_code column already exists in found_items');
        } else {
            console.error('Error adding qr_code to found_items:', err.message);
        }
    } else {
        console.log('✓ Added qr_code column to found_items');
    }

    // Close after both operations
    setTimeout(() => {
        console.log('\nDatabase schema update complete!');
        process.exit(0);
    }, 500);
});
