import { Notification, NotificationPreferences, Item, Match } from '@/types';

class NotificationService {
  private notifications: Notification[] = [];
  private preferences: Map<string, NotificationPreferences> = new Map();
  private subscribers: Map<string, (notifications: Notification[]) => void> = new Map();

  constructor() {
    this.loadFromStorage();
    this.initializeDefaultPreferences();
  }

  // Subscribe to real-time notifications
  subscribe(userId: string, callback: (notifications: Notification[]) => void): () => void {
    this.subscribers.set(userId, callback);
    
    // Send current notifications immediately
    const userNotifications = this.getUserNotifications(userId);
    callback(userNotifications);

    // Return unsubscribe function
    return () => {
      this.subscribers.delete(userId);
    };
  }

  // Create and send notification
  async sendNotification(notification: Omit<Notification, 'id' | 'timestamp'>): Promise<void> {
    const fullNotification: Notification = {
      ...notification,
      id: `notif_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date().toISOString()
    };

    // Check user preferences
    const userPrefs = this.preferences.get(notification.userId);
    if (!userPrefs || !this.shouldSendNotification(fullNotification, userPrefs)) {
      return;
    }

    // Add to notifications list
    this.notifications.unshift(fullNotification);
    this.saveToStorage();

    // Notify subscribers
    const callback = this.subscribers.get(notification.userId);
    if (callback) {
      callback(this.getUserNotifications(notification.userId));
    }

    // Simulate different notification channels
    await this.deliverNotification(fullNotification, userPrefs);
  }

  // Send match notification
  async sendMatchNotification(match: Match, lostItem: Item, foundItem: Item): Promise<void> {
    const lostItemOwner = lostItem.contactInfo;
    const foundItemOwner = foundItem.contactInfo;

    // Notify lost item owner
    await this.sendNotification({
      userId: lostItemOwner.email, // Using email as userId for demo
      type: match.similarityScore > 0.9 ? 'exact_match' : 'potential_match',
      title: match.similarityScore > 0.9 ? '🎯 Exact Match Found!' : '🔍 Potential Match Found',
      message: `Someone found an item that matches your lost ${lostItem.title}. Similarity: ${(match.similarityScore * 100).toFixed(1)}%`,
      itemId: lostItem.id,
      matchId: match.itemId + '_' + match.matchedItemId,
      data: {
        matchedItem: foundItem,
        similarity: match.similarityScore,
        explanation: match.explanation,
        location: foundItem.location.name
      },
      read: false,
      priority: match.similarityScore > 0.9 ? 'high' : 'medium',
      channels: ['in_app', 'email']
    });

    // Notify found item owner
    await this.sendNotification({
      userId: foundItemOwner.email,
      type: 'potential_match',
      title: '📋 Match Request',
      message: `Your found ${foundItem.title} might belong to someone. Please review the match.`,
      itemId: foundItem.id,
      matchId: match.itemId + '_' + match.matchedItemId,
      data: {
        matchedItem: lostItem,
        similarity: match.similarityScore,
        explanation: match.explanation
      },
      read: false,
      priority: 'medium',
      channels: ['in_app']
    });
  }

  // Send feedback request notification
  async sendFeedbackRequest(userId: string, itemId: string, classification: string): Promise<void> {
    await this.sendNotification({
      userId,
      type: 'classification_feedback',
      title: '🤖 Help Improve AI',
      message: `Please confirm if we correctly classified your item as "${classification}"`,
      itemId,
      data: { classification },
      read: false,
      priority: 'low',
      channels: ['in_app']
    });
  }

  // Send training completion notification
  async sendTrainingComplete(userId: string, newAccuracy: number, contribution: number): Promise<void> {
    await this.sendNotification({
      userId,
      type: 'training_complete',
      title: '🎓 AI Model Updated!',
      message: `Thanks to your feedback, our AI improved to ${(newAccuracy * 100).toFixed(1)}% accuracy. You contributed ${contribution} training samples!`,
      data: { newAccuracy, contribution },
      read: false,
      priority: 'medium',
      channels: ['in_app']
    });
  }

  // Get user notifications
  getUserNotifications(userId: string, limit?: number): Notification[] {
    const userNotifications = this.notifications
      .filter(n => n.userId === userId)
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

    return limit ? userNotifications.slice(0, limit) : userNotifications;
  }

  // Get unread count
  getUnreadCount(userId: string): number {
    return this.notifications.filter(n => n.userId === userId && !n.read).length;
  }

  // Mark notifications as read
  markAsRead(notificationIds: string[]): void {
    this.notifications.forEach(notification => {
      if (notificationIds.includes(notification.id)) {
        notification.read = true;
      }
    });
    this.saveToStorage();

    // Notify subscribers
    this.subscribers.forEach((callback, userId) => {
      callback(this.getUserNotifications(userId));
    });
  }

  // Mark all as read for user
  markAllAsRead(userId: string): void {
    const userNotificationIds = this.notifications
      .filter(n => n.userId === userId && !n.read)
      .map(n => n.id);
    
    this.markAsRead(userNotificationIds);
  }

  // Update user preferences
  updatePreferences(userId: string, preferences: Partial<NotificationPreferences>): void {
    const current = this.preferences.get(userId) || this.getDefaultPreferences(userId);
    const updated = { ...current, ...preferences };
    this.preferences.set(userId, updated);
    this.savePreferencesToStorage();
  }

  // Get user preferences
  getPreferences(userId: string): NotificationPreferences {
    return this.preferences.get(userId) || this.getDefaultPreferences(userId);
  }

  // Delete notification
  deleteNotification(notificationId: string): void {
    this.notifications = this.notifications.filter(n => n.id !== notificationId);
    this.saveToStorage();

    // Notify subscribers
    this.subscribers.forEach((callback, userId) => {
      callback(this.getUserNotifications(userId));
    });
  }

  // Clear all notifications for user
  clearAllNotifications(userId: string): void {
    this.notifications = this.notifications.filter(n => n.userId !== userId);
    this.saveToStorage();

    // Notify subscribers
    const callback = this.subscribers.get(userId);
    if (callback) {
      callback([]);
    }
  }

  // Private methods
  private shouldSendNotification(notification: Notification, preferences: NotificationPreferences): boolean {
    // Check if notifications are enabled
    if (!preferences.inAppEnabled && notification.channels.includes('in_app')) {
      return false;
    }

    // Check quiet hours
    if (preferences.quietHours && this.isInQuietHours(preferences.quietHours)) {
      return notification.priority === 'high';
    }

    // Check frequency settings
    if (preferences.notificationFrequency !== 'immediate') {
      // For demo, we'll still send immediately but in real app would batch
      console.log(`Notification batched for ${preferences.notificationFrequency} delivery`);
    }

    return true;
  }

  private isInQuietHours(quietHours: { start: string; end: string }): boolean {
    const now = new Date();
    const currentTime = now.getHours().toString().padStart(2, '0') + ':' + 
                       now.getMinutes().toString().padStart(2, '0');
    
    return currentTime >= quietHours.start && currentTime <= quietHours.end;
  }

  private async deliverNotification(notification: Notification, preferences: NotificationPreferences): Promise<void> {
    // Simulate different delivery channels
    for (const channel of notification.channels) {
      switch (channel) {
        case 'in_app':
          // Already handled by subscriber callbacks
          break;
        case 'email':
          if (preferences.emailEnabled) {
            console.log(`📧 Email sent to ${notification.userId}: ${notification.title}`);
          }
          break;
        case 'push':
          if (preferences.pushEnabled) {
            console.log(`📱 Push notification sent: ${notification.title}`);
          }
          break;
        case 'sms':
          if (preferences.smsEnabled) {
            console.log(`📱 SMS sent: ${notification.title}`);
          }
          break;
      }
    }
  }

  private getDefaultPreferences(userId: string): NotificationPreferences {
    return {
      userId,
      emailEnabled: true,
      pushEnabled: true,
      smsEnabled: false,
      inAppEnabled: true,
      similarityThreshold: 0.8,
      notificationFrequency: 'immediate',
      quietHours: {
        start: '22:00',
        end: '08:00'
      },
      categories: ['all']
    };
  }

  private initializeDefaultPreferences(): void {
    // Initialize with some default users for demo
    const defaultUsers = ['user@example.com', 'demo@example.com'];
    defaultUsers.forEach(userId => {
      if (!this.preferences.has(userId)) {
        this.preferences.set(userId, this.getDefaultPreferences(userId));
      }
    });
  }

  private loadFromStorage(): void {
    try {
      const stored = localStorage.getItem('notifications');
      if (stored) {
        this.notifications = JSON.parse(stored);
      }

      const storedPrefs = localStorage.getItem('notification_preferences');
      if (storedPrefs) {
        const prefsArray = JSON.parse(storedPrefs);
        prefsArray.forEach((pref: NotificationPreferences) => {
          this.preferences.set(pref.userId, pref);
        });
      }
    } catch (error) {
      console.error('Error loading notifications from storage:', error);
    }
  }

  private saveToStorage(): void {
    try {
      localStorage.setItem('notifications', JSON.stringify(this.notifications));
    } catch (error) {
      console.error('Error saving notifications to storage:', error);
    }
  }

  private savePreferencesToStorage(): void {
    try {
      const prefsArray = Array.from(this.preferences.values());
      localStorage.setItem('notification_preferences', JSON.stringify(prefsArray));
    } catch (error) {
      console.error('Error saving preferences to storage:', error);
    }
  }
}

export const notificationService = new NotificationService();