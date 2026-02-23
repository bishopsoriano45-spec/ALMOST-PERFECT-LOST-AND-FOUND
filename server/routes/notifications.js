const express = require('express');
const router = express.Router();
const notificationService = require('../services/notificationService');

// FIX: Route ordering - specific paths MUST come before parameterized paths
// Otherwise /:userId matches everything and specific routes are never reached

// GET /api/notifications/:userId/unread-count - Get unread notification count
router.get('/:userId/unread-count', async (req, res) => {
    try {
        const { userId } = req.params;
        const count = await notificationService.getUnreadCount(userId);

        res.json({ count });
    } catch (error) {
        console.error('Error fetching unread count:', error);
        res.status(500).json({ error: 'Failed to fetch unread count' });
    }
});

// PUT /api/notifications/:userId/read-all - Mark all notifications as read
router.put('/:userId/read-all', async (req, res) => {
    try {
        const { userId } = req.params;
        await notificationService.markAllAsRead(userId);

        res.json({ message: 'All notifications marked as read' });
    } catch (error) {
        console.error('Error marking all notifications as read:', error);
        res.status(500).json({ error: 'Failed to mark all notifications as read' });
    }
});

// GET /api/notifications/:userId - Get user notifications (MUST be after specific routes)
router.get('/:userId', async (req, res) => {
    try {
        const { userId } = req.params;
        const { unreadOnly } = req.query;

        const notifications = await notificationService.getNotifications(
            userId,
            unreadOnly === 'true'
        );

        res.json(notifications);
    } catch (error) {
        console.error('Error fetching notifications:', error);
        res.status(500).json({ error: 'Failed to fetch notifications' });
    }
});

// PUT /api/notifications/:id/read - Mark notification as read
router.put('/:id/read', async (req, res) => {
    try {
        const { id } = req.params;
        await notificationService.markAsRead(parseInt(id));

        res.json({ message: 'Notification marked as read' });
    } catch (error) {
        console.error('Error marking notification as read:', error);
        res.status(500).json({ error: 'Failed to mark notification as read' });
    }
});

// DELETE /api/notifications/:id - Delete notification
router.delete('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        await notificationService.deleteNotification(parseInt(id));

        res.json({ message: 'Notification deleted successfully' });
    } catch (error) {
        console.error('Error deleting notification:', error);
        res.status(500).json({ error: 'Failed to delete notification' });
    }
});

module.exports = router;
