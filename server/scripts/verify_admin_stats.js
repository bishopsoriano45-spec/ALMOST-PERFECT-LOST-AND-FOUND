require('dotenv').config();
const adminService = require('../services/adminService');

async function verifyPointsStats() {
    console.log("Verifying getPointsStats()...");
    try {
        const stats = await adminService.getPointsStats();
        console.log("✅ Stats fetched successfully:");
        console.log(JSON.stringify(stats, null, 2));
    } catch (err) {
        console.error("❌ Error fetching stats:", err.message);
        console.error("Detail:", err);
    } finally {
        // We need to close the pool to exit script, but adminService doesn't export pool directly.
        // We'll just exit after a delay or let it hang (ctrl+c).
        // Actually, importing db allows closing it.
        const { pool } = require('../db/db');
        await pool.end();
        console.log("Done.");
    }
}

verifyPointsStats();
