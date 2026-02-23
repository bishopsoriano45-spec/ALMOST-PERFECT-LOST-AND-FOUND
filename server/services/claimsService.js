const { pool } = require('../db/db');
const notificationService = require('./notificationService');

/**
 * Claims Service - Manages claim lifecycle
 */

/**
 * Get all claims with item details
 */
async function getClaims(status = 'all') {
    const client = await pool.connect();
    try {
        let query = `
            SELECT 
                c.*,
                u.email as claimer_email,
                l.title as lost_item_title, l.image_path as lost_item_image,
                f.title as found_item_title, f.image_path as found_item_image
            FROM claims c
            JOIN users u ON c.claimer_id = u.user_id
            LEFT JOIN lost_items l ON c.lost_item_id = l.id
            LEFT JOIN found_items f ON c.found_item_id = f.id
        `;

        const params = [];
        if (status !== 'all') {
            query += ' WHERE c.status = $1';
            params.push(status);
        }

        query += ' ORDER BY c.created_at DESC';

        const res = await client.query(query, params);
        return res.rows;
    } finally {
        client.release();
    }
}

/**
 * Create a new claim
 */
async function createClaim(data) {
    const client = await pool.connect();
    try {
        let { lostItemId, foundItemId, claimerId, claimerEmail, claimerName, matchScore, verificationNotes } = data;

        // Helper to extract numeric ID from string (e.g., "found_34" -> 34)
        const parseId = (val) => {
            if (!val) return null;
            if (typeof val === 'number') return val;
            const match = val.toString().match(/(\d+)$/);
            return match ? parseInt(match[1], 10) : null;
        };

        // Ensure optional fields are null if undefined and parsed correctly
        lostItemId = parseId(lostItemId);
        foundItemId = parseId(foundItemId);
        matchScore = matchScore || null;
        verificationNotes = verificationNotes || null;

        console.log(`Creating claim: lost=${lostItemId}, found=${foundItemId}`); // Debug log

        // Handle Guest Claims
        if (claimerId === 'guest' || !claimerId) {
            // Check if user exists by email
            const userCheck = await client.query('SELECT user_id FROM users WHERE email = $1', [claimerEmail]);

            if (userCheck.rows.length > 0) {
                claimerId = userCheck.rows[0].user_id;
            } else {
                // Create a temporary/guest user
                // Using a simple unpredictable password or leaving it null if schema allows (likely not for simple auth)
                // For now, let's assume we can create a user. If password required, use a placeholder.
                const newUserId = 'guest_' + Date.now();
                const insertUser = `
                    INSERT INTO users (user_id, email, password_hash, role)
                    VALUES ($1, $2, $3, 'user')
                    RETURNING user_id
                `;
                // Mock password hash for guest (they can reset it later if they want to claim account)
                await client.query(insertUser, [newUserId, claimerEmail, 'guest_account']);
                claimerId = newUserId;
            }
        }

        const query = `
            INSERT INTO claims (lost_item_id, found_item_id, claimer_id, match_score, verification_notes)
            VALUES ($1, $2, $3, $4, $5)
            RETURNING *
        `;

        const res = await client.query(query, [lostItemId, foundItemId, claimerId, matchScore, verificationNotes]);

        // Notify admin (system notification for now)
        // In a real app, you might email admins here

        return res.rows[0];
    } finally {
        client.release();
    }
}

/**
 * Process a claim (Approve/Reject)
 */
async function processClaim(claimId, decision, adminNotes) {
    const client = await pool.connect();
    try {
        await client.query('BEGIN');

        // Update claim status
        const updateQuery = `
            UPDATE claims 
            SET status = $1, verification_notes = $2, admin_decision_date = NOW()
            WHERE id = $3
            RETURNING *
        `;
        const claimRes = await client.query(updateQuery, [decision, adminNotes, claimId]);
        const claim = claimRes.rows[0];

        if (!claim) {
            throw new Error('Claim not found');
        }

        // If approved, update item statuses
        if (decision === 'approved') {
            if (claim.lost_item_id) {
                await client.query("UPDATE lost_items SET status = 'claimed' WHERE id = $1", [claim.lost_item_id]);
            }
            if (claim.found_item_id) {
                await client.query("UPDATE found_items SET status = 'claimed' WHERE id = $1", [claim.found_item_id]);

                // Award points to the finder (reporter of the found item)
                const foundItemRes = await client.query('SELECT user_id FROM found_items WHERE id = $1', [claim.found_item_id]);
                if (foundItemRes.rows.length > 0) {
                    const finderId = foundItemRes.rows[0].user_id;
                    console.log(`Awarding points to finder: ${finderId}`);
                    // Award 5 points
                    const pointsRes = await client.query('UPDATE users SET points = points + 5 WHERE user_id = $1 RETURNING points', [finderId]);
                    console.log(`Points updated for ${finderId}:`, pointsRes.rows[0]);

                    // Notify finder about points
                    await notificationService.createNotification(finderId, 'system', {
                        title: 'Points Earned!',
                        message: 'You earned 5 points for helping return a lost item!',
                        relatedItemId: claim.found_item_id.toString(),
                        matchId: null
                    });
                }
            }
        }

        // Notify user
        const notificationType = decision === 'approved' ? 'item_claimed' : 'system';
        const title = decision === 'approved' ? 'Claim Approved!' : 'Claim Status Update';
        const message = decision === 'approved'
            ? `Your claim for item #${claim.found_item_id || claim.lost_item_id} has been approved.`
            : `Your claim has been updated to: ${decision}. Notes: ${adminNotes}`;

        await notificationService.createNotification(claim.claimer_id, notificationType, {
            title,
            message,
            relatedItemId: (claim.lost_item_id || claim.found_item_id)?.toString(),
            matchId: null
        });

        await client.query('COMMIT');
        return claim;
    } catch (error) {
        await client.query('ROLLBACK');
        throw error;
    } finally {
        client.release();
    }
}

module.exports = {
    getClaims,
    createClaim,
    processClaim
};
