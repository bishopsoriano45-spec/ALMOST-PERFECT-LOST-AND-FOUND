const db = require('../db/db');
const emailService = require('./emailService');

/**
 * Notification Service - Manages user notifications
 */

/**
 * Get user email by user ID
 */
async function getUserEmail(userId) {
    return new Promise((resolve, reject) => {
        db.get('SELECT email FROM users WHERE user_id = ?', [userId], (err, row) => {
            if (err) {
                return reject(err);
            }
            resolve(row ? row.email : null);
        });
    });
}

/**
 * Create a new notification
 * @param {string} userId - User ID to notify
 * @param {string} type - Notification type ('match_found', 'item_claimed', 'verification_required', 'system')
 * @param {Object} data - Notification data
 * @returns {Promise<Object>} Created notification
 */
async function createNotification(userId, type, data) {
    return new Promise((resolve, reject) => {
        const {
            title,
            message,
            relatedItemId,
            matchId,
            metadata
        } = data;

        const sql = `
            INSERT INTO notifications (user_id, type, title, message, related_item_id, match_id, metadata)
            VALUES (?, ?, ?, ?, ?, ?, ?)
            RETURNING id
        `;

        const metadataJson = metadata ? JSON.stringify(metadata) : null;

        db.run(sql, [userId, type, title, message, relatedItemId, matchId, metadataJson], function (err) {
            if (err) {
                return reject(err);
            }

            // Retrieve the created notification
            db.get('SELECT * FROM notifications WHERE id = ?', [this.lastID], (err, row) => {
                if (err) {
                    return reject(err);
                }
                resolve(mapNotificationRow(row));
            });
        });
    });
}

/**
 * Create match notification for a user
 * @param {string} userId - User to notify
 * @param {Object} userItem - User's item (lost or found)
 * @param {Object} match - Match details
 * @returns {Promise<Object>} Created notification
 */
async function createMatchNotification(userId, userItem, match) {
    const isLostItem = userItem.type === 'lost';
    const matchType = isLostItem ? 'found' : 'lost';

    const title = `Potential Match Found!`;
    // FIX: Added space before "Match" and removed trailing space
    const message = `We found a ${matchType} item that matches your ${userItem.type} item "${userItem.title}". Match confidence: ${Math.round(match.matchScore * 100)}%`;

    const metadata = {
        matchScore: match.matchScore,
        confidence: match.confidence,
        explanation: match.explanation,
        details: match.details,
        matchedItem: {
            id: match.item.id,
            title: match.item.title,
            imageUrl: match.item.imageUrl,
            location: match.item.location,
            dateReported: match.item.dateReported
        }
    };

    // Create in-app notification
    const notification = await createNotification(userId, 'match_found', {
        title,
        message,
        relatedItemId: userItem.id,
        matchId: null,
        metadata
    });

    // Send email notification synchronously to ensure it works before returning
    // Priority: 1. Item-specific contact email (guest or override), 2. User account email
    const recipientEmail = userItem.contact_email || null;
    let emailResult = { success: false, skipped: true };

    console.log(`[MATCHING] PREPARING EMAIL for User ${userId}, Recipient: ${recipientEmail || 'Lookup required'}`);

    const sendEmailLogic = async (email) => {
        if (!email) {
            console.warn(`[MATCHING] EMAIL ABORTED: No email address found for User ${userId}`);
            return;
        }

        const APP_URL = process.env.APP_URL || 'http://localhost:5173';
        const emailData = {
            userName: 'User', // Could be enhanced to get actual user name
            userItemTitle: userItem.title,
            matchedItemTitle: match.item.title,
            matchScore: match.matchScore,
            confidence: match.confidence,
            explanation: match.explanation,
            matchedItem: metadata.matchedItem,
            itemLink: `${APP_URL}/item/${match.item.id}`
        };

        console.log(`[MATCHING] EMAIL SENDING STARTED to ${email}`);
        try {
            const result = await emailService.sendMatchNotificationEmail(email, emailData);
            if (result.success) {
                console.log(`[MATCHING] EMAIL SENT successfully to ${email}. MessageID: ${result.messageId}`);
                emailResult = result;
            } else {
                console.error(`[MATCHING] EMAIL FAILED to ${email}:`, result.message || result.error);
            }
        } catch (error) {
            console.error(`[MATCHING] EMAIL EXCEPTION to ${email}:`, error);
        }
    };

    if (recipientEmail) {
        console.log(`[MATCHING] Using provided contact email: ${recipientEmail}`);
        await sendEmailLogic(recipientEmail);
    } else {
        console.log(`[MATCHING] No contact email provided, fetching user email for: ${userId}`);
        try {
            const userEmail = await getUserEmail(userId);
            if (userEmail) {
                console.log(`[MATCHING] Found user email: ${userEmail}`);
                await sendEmailLogic(userEmail);
            } else {
                console.warn(`[MATCHING] No email found for user ${userId} in database`);
            }
        } catch (error) {
            console.error(`[MATCHING] EMAIL ERROR: Could not fetch user email for ${userId}:`, error);
        }
    }

    return notification;
}

/**
 * Get notifications for a user
 * @param {string} userId - User ID
 * @param {boolean} unreadOnly - Only return unread notifications
 * @returns {Promise<Array>} Array of notifications
 */
async function getNotifications(userId, unreadOnly = false) {
    return new Promise((resolve, reject) => {
        let sql = 'SELECT * FROM notifications WHERE user_id = ?';
        if (unreadOnly) {
            sql += ' AND read_status = 0';
        }
        sql += ' ORDER BY created_at DESC';

        db.all(sql, [userId], (err, rows) => {
            if (err) {
                return reject(err);
            }
            resolve(rows.map(mapNotificationRow));
        });
    });
}

/**
 * Get unread notification count
 * @param {string} userId - User ID
 * @returns {Promise<number>} Count of unread notifications
 */
async function getUnreadCount(userId) {
    return new Promise((resolve, reject) => {
        const sql = 'SELECT COUNT(*) as count FROM notifications WHERE user_id = ? AND read_status = 0';

        db.get(sql, [userId], (err, row) => {
            if (err) {
                return reject(err);
            }
            resolve(row.count);
        });
    });
}

/**
 * Mark notification as read
 * @param {number} notificationId - Notification ID
 * @returns {Promise<void>}
 */
async function markAsRead(notificationId) {
    return new Promise((resolve, reject) => {
        const sql = 'UPDATE notifications SET read_status = 1 WHERE id = ?';

        db.run(sql, [notificationId], function (err) {
            if (err) {
                return reject(err);
            }
            resolve();
        });
    });
}

/**
 * Mark all notifications as read for a user
 * @param {string} userId - User ID
 * @returns {Promise<void>}
 */
async function markAllAsRead(userId) {
    return new Promise((resolve, reject) => {
        const sql = 'UPDATE notifications SET read_status = 1 WHERE user_id = ? AND read_status = 0';

        db.run(sql, [userId], function (err) {
            if (err) {
                return reject(err);
            }
            resolve();
        });
    });
}

/**
 * Delete a notification
 * @param {number} notificationId - Notification ID
 * @returns {Promise<void>}
 */
async function deleteNotification(notificationId) {
    return new Promise((resolve, reject) => {
        const sql = 'DELETE FROM notifications WHERE id = ?';

        db.run(sql, [notificationId], function (err) {
            if (err) {
                return reject(err);
            }
            resolve();
        });
    });
}

/**
 * Map database row to notification object
 */
function mapNotificationRow(row) {
    let metadata = null;
    if (row.metadata) {
        try {
            metadata = JSON.parse(row.metadata);
        } catch (e) {
            console.error('Error parsing notification metadata:', e);
        }
    }

    return {
        id: row.id.toString(),
        userId: row.user_id,
        type: row.type,
        title: row.title,
        message: row.message,
        relatedItemId: row.related_item_id,
        matchId: row.match_id,
        metadata,
        read: row.read_status === 1,
        timestamp: row.created_at
    };
}

module.exports = {
    createNotification,
    createMatchNotification,
    getNotifications,
    getUnreadCount,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    getUserEmail // Exporting for testing/debugging
};
