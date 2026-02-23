import { Notification } from '@/types';

const API_BASE_URL = '/api';

/**
 * Notification Service - Manages notifications via backend API
 */

/**
 * Get notifications for a user
 */
export async function getNotifications(userId: string, unreadOnly: boolean = false): Promise<Notification[]> {
    try {
        const url = `${API_BASE_URL}/notifications/${userId}${unreadOnly ? '?unreadOnly=true' : ''}`;
        const response = await fetch(url);

        if (!response.ok) {
            throw new Error('Failed to fetch notifications');
        }

        return await response.json();
    } catch (error) {
        console.error('Error fetching notifications:', error);
        return [];
    }
}

/**
 * Get unread notification count
 */
export async function getUnreadCount(userId: string): Promise<number> {
    try {
        const response = await fetch(`${API_BASE_URL}/notifications/${userId}/unread-count`);

        if (!response.ok) {
            throw new Error('Failed to fetch unread count');
        }

        const data = await response.json();
        return data.count;
    } catch (error) {
        console.error('Error fetching unread count:', error);
        return 0;
    }
}

/**
 * Mark a notification as read
 */
export async function markAsRead(notificationId: string): Promise<void> {
    try {
        const response = await fetch(`${API_BASE_URL}/notifications/${notificationId}/read`, {
            method: 'PUT',
        });

        if (!response.ok) {
            throw new Error('Failed to mark notification as read');
        }
    } catch (error) {
        console.error('Error marking notification as read:', error);
        throw error;
    }
}

/**
 * Mark all notifications as read for a user
 */
export async function markAllAsRead(userId: string): Promise<void> {
    try {
        const response = await fetch(`${API_BASE_URL}/notifications/${userId}/read-all`, {
            method: 'PUT',
        });

        if (!response.ok) {
            throw new Error('Failed to mark all notifications as read');
        }
    } catch (error) {
        console.error('Error marking all notifications as read:', error);
        throw error;
    }
}

/**
 * Delete a notification
 */
export async function deleteNotification(notificationId: string): Promise<void> {
    try {
        const response = await fetch(`${API_BASE_URL}/notifications/${notificationId}`, {
            method: 'DELETE',
        });

        if (!response.ok) {
            throw new Error('Failed to delete notification');
        }
    } catch (error) {
        console.error('Error deleting notification:', error);
        throw error;
    }
}
