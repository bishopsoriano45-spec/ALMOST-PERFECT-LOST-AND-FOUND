import { Item, Match, UserFeedback, Notification } from '@/types';

const STORAGE_KEYS = {
  ITEMS: 'lostfound_items',
  MATCHES: 'lostfound_matches',
  FEEDBACK: 'lostfound_feedback',
  NOTIFICATIONS: 'lostfound_notifications',
  USER_ID: 'lostfound_user_id'
};

// Generate a simple user ID for demo purposes
export const getUserId = (): string => {
  let userId = localStorage.getItem(STORAGE_KEYS.USER_ID);
  if (!userId) {
    userId = 'user_' + Math.random().toString(36).substr(2, 9);
    localStorage.setItem(STORAGE_KEYS.USER_ID, userId);
  }
  return userId;
};

// Items management
export const saveItem = (item: Item): void => {
  const items = getItems();
  const existingIndex = items.findIndex(i => i.id === item.id);
  
  if (existingIndex >= 0) {
    items[existingIndex] = item;
  } else {
    items.push(item);
  }
  
  localStorage.setItem(STORAGE_KEYS.ITEMS, JSON.stringify(items));
};

export const getItems = (): Item[] => {
  const stored = localStorage.getItem(STORAGE_KEYS.ITEMS);
  return stored ? JSON.parse(stored) : [];
};

export const getItemById = (id: string): Item | null => {
  const items = getItems();
  return items.find(item => item.id === id) || null;
};

export const getUserItems = (userId: string): Item[] => {
  const items = getItems();
  return items.filter(item => item.contactInfo.email === userId);
};

// Matches management
export const saveMatch = (match: Match): void => {
  const matches = getMatches();
  matches.push(match);
  localStorage.setItem(STORAGE_KEYS.MATCHES, JSON.stringify(matches));
};

export const getMatches = (): Match[] => {
  const stored = localStorage.getItem(STORAGE_KEYS.MATCHES);
  return stored ? JSON.parse(stored) : [];
};

export const getMatchesForItem = (itemId: string): Match[] => {
  const matches = getMatches();
  return matches.filter(match => 
    match.itemId === itemId || match.matchedItemId === itemId
  );
};

// Feedback management
export const saveFeedback = (feedback: UserFeedback): void => {
  const feedbacks = getFeedbacks();
  feedbacks.push(feedback);
  localStorage.setItem(STORAGE_KEYS.FEEDBACK, JSON.stringify(feedbacks));
};

export const getFeedbacks = (): UserFeedback[] => {
  const stored = localStorage.getItem(STORAGE_KEYS.FEEDBACK);
  return stored ? JSON.parse(stored) : [];
};

// Notifications management
export const saveNotification = (notification: Notification): void => {
  const notifications = getNotifications();
  notifications.push(notification);
  localStorage.setItem(STORAGE_KEYS.NOTIFICATIONS, JSON.stringify(notifications));
};

export const getNotifications = (): Notification[] => {
  const stored = localStorage.getItem(STORAGE_KEYS.NOTIFICATIONS);
  return stored ? JSON.parse(stored) : [];
};

export const getUserNotifications = (userId: string): Notification[] => {
  const notifications = getNotifications();
  return notifications.filter(n => n.userId === userId);
};

export const markNotificationAsRead = (notificationId: string): void => {
  const notifications = getNotifications();
  const notification = notifications.find(n => n.id === notificationId);
  if (notification) {
    notification.read = true;
    localStorage.setItem(STORAGE_KEYS.NOTIFICATIONS, JSON.stringify(notifications));
  }
};

// Generate QR code data
export const generateQRCode = (itemId: string): string => {
  const baseUrl = window.location.origin;
  return `${baseUrl}/item/${itemId}`;
};

// Initialize with sample data
export const initializeSampleData = (): void => {
  const existingItems = getItems();
  if (existingItems.length === 0) {
    const sampleItems: Item[] = [
      {
        id: 'item_1',
        type: 'lost',
        title: 'Black iPhone 14',
        description: 'Black iPhone 14 with a clear case. Has a small crack on the bottom right corner.',
        category: 'phone',
        location: { name: 'Library - 2nd Floor' },
        dateReported: '2024-01-15T10:30:00Z',
        contactInfo: {
          name: 'Sarah Johnson',
          email: 'sarah.j@university.edu',
          phone: '+1-555-0123'
        },
        status: 'active',
        tags: ['black', 'cracked', 'clear case'],
        aiClassification: {
          category: 'phone',
          confidence: 0.92,
          features: ['rectangular shape', 'screen', 'camera lens', 'charging port']
        },
        verificationRequired: true
      },
      {
        id: 'item_2',
        type: 'found',
        title: 'iPhone with Clear Case',
        description: 'Found an iPhone with a transparent case in the library. Screen appears to have some damage.',
        category: 'phone',
        location: { name: 'Library - Study Area' },
        dateReported: '2024-01-15T14:20:00Z',
        contactInfo: {
          name: 'Mike Chen',
          email: 'mike.c@university.edu'
        },
        status: 'active',
        tags: ['phone', 'clear case', 'damaged'],
        aiClassification: {
          category: 'phone',
          confidence: 0.89,
          features: ['rectangular shape', 'screen', 'camera lens', 'case']
        },
        verificationRequired: false
      },
      {
        id: 'item_3',
        type: 'lost',
        title: 'Brown Leather Wallet',
        description: 'Brown leather wallet with multiple card slots. Contains my student ID and driver license.',
        category: 'wallet',
        location: { name: 'Student Center - Cafeteria' },
        dateReported: '2024-01-14T16:45:00Z',
        contactInfo: {
          name: 'Alex Rivera',
          email: 'alex.r@university.edu',
          phone: '+1-555-0456'
        },
        status: 'active',
        tags: ['brown', 'leather', 'cards'],
        aiClassification: {
          category: 'wallet',
          confidence: 0.85,
          features: ['rectangular', 'leather texture', 'card slots', 'fold line']
        },
        verificationRequired: true
      }
    ];
    
    sampleItems.forEach(saveItem);
  }
};