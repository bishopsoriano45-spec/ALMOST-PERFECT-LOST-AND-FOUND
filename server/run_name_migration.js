
const db = require('./db/db');

console.log('Starting migration to add name column to users...');

const sql = `
  ALTER TABLE users ADD COLUMN IF NOT EXISTS name TEXT;
`;

db.exec(sql, (err) => {
    if (err) {
        console.error('❌ Error executing migration:', err);
        process.exit(1);
    } else {
        console.log('✅ Name column migration executed successfully!');
        process.exit(0);
    }
});
