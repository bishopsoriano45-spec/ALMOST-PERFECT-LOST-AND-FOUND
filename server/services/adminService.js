const { pool } = require('../db/db');

/**
 * Admin Service - Manages dashboard stats and user management
 */

/**
 * Get dashboard statistics
 */
async function getDashboardStats() {
    const client = await pool.connect();
    try {
        // Total Items
        const totalItemsRes = await client.query('SELECT COUNT(*) FROM (SELECT id FROM lost_items UNION ALL SELECT id FROM found_items) as items');
        const totalItems = parseInt(totalItemsRes.rows[0].count);

        // Active Items (Open status)
        const activeLostRes = await client.query("SELECT COUNT(*) FROM lost_items WHERE status = 'open'");
        const activeFoundRes = await client.query("SELECT COUNT(*) FROM found_items WHERE status = 'open'");
        const activeItems = parseInt(activeLostRes.rows[0].count) + parseInt(activeFoundRes.rows[0].count);

        // Resolved Items (Claimed/Closed/Matched)
        const resolvedLostRes = await client.query("SELECT COUNT(*) FROM lost_items WHERE status IN ('claimed', 'closed', 'matched')");
        const resolvedFoundRes = await client.query("SELECT COUNT(*) FROM found_items WHERE status IN ('claimed', 'closed', 'matched')");
        const resolvedItems = parseInt(resolvedLostRes.rows[0].count) + parseInt(resolvedFoundRes.rows[0].count);

        // Recent Items (Last 30 days)
        const recentItemsRes = await client.query(`
            SELECT COUNT(*) FROM (
                SELECT created_at FROM lost_items WHERE created_at > NOW() - INTERVAL '30 days'
                UNION ALL 
                SELECT created_at FROM found_items WHERE created_at > NOW() - INTERVAL '30 days'
            ) as recent
        `);
        const recentItemsCount = parseInt(recentItemsRes.rows[0].count);

        // Category Distribution
        const categoryRes = await client.query(`
            SELECT category, COUNT(*) as count FROM (
                SELECT category FROM lost_items
                UNION ALL
                SELECT category FROM found_items
            ) as categories
            GROUP BY category
        `);

        // Claims Stats
        const claimsRes = await client.query("SELECT status, COUNT(*) FROM claims GROUP BY status");
        const claimsStats = claimsRes.rows.reduce((acc, row) => {
            acc[row.status] = parseInt(row.count);
            return acc;
        }, { pending: 0, approved: 0, rejected: 0 });

        return {
            total: totalItems,
            active: activeItems,
            resolved: resolvedItems,
            recentItems: recentItemsCount,
            lost: parseInt(activeLostRes.rows[0].count), // distinct from 'active' which sums both
            found: parseInt(activeFoundRes.rows[0].count),
            categories: categoryRes.rows.map(row => ({ category: row.category, count: parseInt(row.count) })),
            claims: claimsStats
        };
    } finally {
        client.release();
    }
}

/**
 * Get all users with stats
 */
async function getUsers() {
    const client = await pool.connect();
    try {
        const query = `
            SELECT 
                u.user_id, 
                u.email, 
                u.role, 
                u.created_at,
                COALESCE(u.points, 0) as points,
                (SELECT COUNT(*) FROM lost_items WHERE user_id = u.user_id) as lost_count,
                (SELECT COUNT(*) FROM found_items WHERE user_id = u.user_id) as found_count,
                (SELECT COUNT(*) FROM claims WHERE claimer_id = u.user_id AND status = 'approved') as successful_claims
            FROM users u
            ORDER BY u.created_at DESC
        `;
        const res = await client.query(query);
        return res.rows;
    } finally {
        client.release();
    }
}

/**
 * Update user status/role
 */
async function updateUser(userId, data) {
    const client = await pool.connect();
    try {
        const { role } = data;
        const query = 'UPDATE users SET role = $1 WHERE user_id = $2 RETURNING *';
        const res = await client.query(query, [role, userId]);
        return res.rows[0];
    } finally {
        client.release();
    }
}

/**
 * Get Points Statistics
 */
/**
 * Get Points Statistics (Robust Implementation)
 */
async function getPointsStats() {
    const client = await pool.connect();
    try {
        console.log('📊 Fetching points stats...');

        // 1. Total Points Distributed (Safe against NULL)
        const totalPointsRes = await client.query('SELECT COALESCE(SUM(points), 0) as total FROM users');
        const totalPoints = parseInt(totalPointsRes.rows[0].total);

        // 2. Top Contributors (Safe query)
        const topContributorsRes = await client.query(`
            SELECT 
                u.user_id, 
                u.email, 
                COALESCE(u.points, 0) as points,
                (SELECT COUNT(*) FROM found_items WHERE user_id = u.user_id) as found_count 
            FROM users u
            ORDER BY u.points DESC 
            LIMIT 10
        `);

        // 3. Points Distribution
        const distributionRes = await client.query(`
            SELECT 
                CASE 
                    WHEN COALESCE(points, 0) = 0 THEN '0'
                    WHEN points BETWEEN 1 AND 50 THEN '1-50'
                    WHEN points BETWEEN 51 AND 100 THEN '51-100'
                    WHEN points BETWEEN 101 AND 500 THEN '101-500'
                    ELSE '500+' 
                END as bracket,
                COUNT(*) as count
            FROM users
            GROUP BY 1
        `);

        // 4. Recent Activity (Using points_transactions if available, else empty)
        let recentActivity = [];
        try {
            // Check if points_transactions table exists (it should, but be safe)
            const recentActivityRes = await client.query(`
                SELECT 
                    t.created_at as date,
                    u.email,
                    t.reason,
                    t.points
                FROM points_transactions t
                JOIN users u ON t.user_id = u.user_id
                ORDER BY t.created_at DESC
                LIMIT 10
            `);
            recentActivity = recentActivityRes.rows;
        } catch (err) {
            console.warn('⚠️ Could not fetch from points_transactions (table might be empty or missing columns), failing gracefully:', err.message);
            // Fallback to empty list or alternate query if needed
            recentActivity = [];
        }

        return {
            totalPoints,
            topContributors: topContributorsRes.rows,
            distribution: distributionRes.rows,
            recentActivity
        };
    } catch (error) {
        console.error('❌ Error in getPointsStats service:', error);
        throw error; // Re-throw to be caught by route handler
    } finally {
        client.release();
    }
}

/**
 * Reset user points
 */
async function resetUserPoints(userId) {
    const client = await pool.connect();
    try {
        const query = 'UPDATE users SET points = 0 WHERE user_id = $1 RETURNING *';
        const res = await client.query(query, [userId]);
        return res.rows[0];
    } finally {
        client.release();
    }
}


/**
 * Reset ALL users points
 */
async function resetAllUserPoints() {
    const client = await pool.connect();
    try {
        const query = 'UPDATE users SET points = 0 RETURNING *';
        const res = await client.query(query);
        return { count: res.rowCount };
    } finally {
        client.release();
    }
}

module.exports = {
    getDashboardStats,
    getUsers,
    updateUser,
    getPointsStats,
    resetUserPoints,
    resetAllUserPoints
};
