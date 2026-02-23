require('dotenv').config();
const { pool } = require('../db/db');

async function fixSchema() {
    console.log("Starting Schema Fix...");
    const client = await pool.connect();
    try {
        // 1. Add points column to users if missing
        console.log("Checking 'users' table for 'points' column...");
        try {
            await client.query(`
                ALTER TABLE users ADD COLUMN points INTEGER DEFAULT 0;
            `);
            console.log("✅ Added 'points' column to 'users'.");
        } catch (err) {
            if (err.code === '42701') { // duplicate_column
                console.log("ℹ️ 'points' column already exists.");
            } else {
                console.error("⚠️ Error adding 'points' column:", err.message);
            }
        }

        // 2. Create claims table if missing
        console.log("Checking 'claims' table...");
        try {
            await client.query(`
                CREATE TABLE IF NOT EXISTS claims (
                    id SERIAL PRIMARY KEY,
                    lost_item_id INTEGER,
                    found_item_id INTEGER,
                    claimer_id TEXT NOT NULL,
                    status TEXT CHECK(status IN ('pending', 'approved', 'rejected')) DEFAULT 'pending',
                    match_score REAL,
                    verification_notes TEXT,
                    admin_decision_date TIMESTAMP,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    FOREIGN KEY(lost_item_id) REFERENCES lost_items(id),
                    FOREIGN KEY(found_item_id) REFERENCES found_items(id),
                    FOREIGN KEY(claimer_id) REFERENCES users(user_id)
                );
            `);
            // Add index if not exists (Postgres doesn't support CREATE INDEX IF NOT EXISTS in all versions, but 9.5+ does)
            await client.query(`CREATE INDEX IF NOT EXISTS idx_claims_claimer_id ON claims(claimer_id);`);
            console.log("✅ 'claims' table verified/created.");
        } catch (err) {
            console.error("⚠️ Error creating 'claims' table:", err.message);
        }

    } catch (err) {
        console.error("❌ Fatal DB Error:", err);
    } finally {
        client.release();
        pool.end();
        console.log("Schema Fix Complete.");
    }
}

fixSchema();
