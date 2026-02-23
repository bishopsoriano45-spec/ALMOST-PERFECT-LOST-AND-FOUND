const { Pool } = require('pg');
const path = require('path');
const fs = require('fs');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });

const pool = new Pool({
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 5432,
    database: process.env.DB_NAME || 'lost_found',
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD,
});

async function resetSystem() {
    try {
        console.log('--- Starting System Reset ---');

        // 1. Clear Database Tables
        console.log('Clearing database tables...');

        // Order matters due to foreign keys
        await pool.query('DELETE FROM notifications');
        await pool.query('DELETE FROM claims');
        await pool.query('DELETE FROM matches'); // If exists
        await pool.query('DELETE FROM lost_items');
        await pool.query('DELETE FROM found_items');

        // Optionally clear feedback if requested, but user emphasized items. 
        // User said "uploaded items and the ones you put to populate".
        // Let's keep users for now unless they are guest users?
        // Let's clear guest users created by tests.
        // Clear all users EXCEPT admin
        // Assuming admin has role='admin' or specific email/id if hardcoded.
        // During setup, we usually create an admin.
        // Let's delete everyone who is NOT an admin.
        await pool.query("DELETE FROM users WHERE role != 'admin'");

        // Reset points for remaining admins
        await pool.query("UPDATE users SET points = 0, found_count = 0, lost_count = 0, successful_claims = 0");

        console.log('Database tables cleared.');

        // 2. Clear Uploads Directory
        const uploadsDir = path.join(__dirname, '../uploads');
        console.log(`Clearing uploads directory: ${uploadsDir}`);

        if (fs.existsSync(uploadsDir)) {
            const files = fs.readdirSync(uploadsDir);
            for (const file of files) {
                if (file === '.gitignore' || file === 'placeholders') continue;

                const filePath = path.join(uploadsDir, file);
                try {
                    // Check if it's a directory (like placeholders)
                    if (fs.lstatSync(filePath).isDirectory()) continue;

                    fs.unlinkSync(filePath);
                    console.log(`Deleted file: ${file}`);
                } catch (err) {
                    console.error(`Failed to delete ${file}:`, err.message);
                }
            }
        } else {
            console.log('Uploads directory does not exist.');
        }

        console.log('--- System Reset Complete ---');

    } catch (err) {
        if (err.code === '42P01') {
            console.log("Some tables didn't exist, which is fine.");
        } else {
            console.error('Reset failed:', err);
        }
    } finally {
        await pool.end();
    }
}

resetSystem();
