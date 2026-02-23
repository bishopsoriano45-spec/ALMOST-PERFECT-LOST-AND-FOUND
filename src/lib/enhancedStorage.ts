import { Item, Notification, UserStats, TrainingData, ModelVersion } from '@/types';

// Enhanced storage with auto-learning capabilities
class EnhancedStorage {
  private readonly ITEMS_KEY = 'enhanced_lost_found_items';
  private readonly NOTIFICATIONS_KEY = 'enhanced_notifications';
  private readonly USER_STATS_KEY = 'enhanced_user_stats';
  private readonly TRAINING_DATA_KEY = 'enhanced_training_data';
  private readonly MODEL_VERSIONS_KEY = 'enhanced_model_versions';

  // Items management
  getItems(): Item[] {
    try {
      const stored = localStorage.getItem(this.ITEMS_KEY);
      return stored ? JSON.parse(stored) : [];
    } catch (error) {
      console.error('Error loading items:', error);
      return [];
    }
  }

  saveItem(item: Item): void {
    try {
      const items = this.getItems();
      const existingIndex = items.findIndex(i => i.id === item.id);
      
      if (existingIndex >= 0) {
        items[existingIndex] = item;
      } else {
        items.unshift(item);
      }
      
      localStorage.setItem(this.ITEMS_KEY, JSON.stringify(items));
    } catch (error) {
      console.error('Error saving item:', error);
    }
  }

  updateItem(itemId: string, updates: Partial<Item>): void {
    try {
      const items = this.getItems();
      const index = items.findIndex(i => i.id === itemId);
      
      if (index >= 0) {
        items[index] = { ...items[index], ...updates };
        localStorage.setItem(this.ITEMS_KEY, JSON.stringify(items));
      }
    } catch (error) {
      console.error('Error updating item:', error);
    }
  }

  deleteItem(itemId: string): void {
    try {
      const items = this.getItems().filter(i => i.id !== itemId);
      localStorage.setItem(this.ITEMS_KEY, JSON.stringify(items));
    } catch (error) {
      console.error('Error deleting item:', error);
    }
  }

  // Notifications management
  getNotifications(): Notification[] {
    try {
      const stored = localStorage.getItem(this.NOTIFICATIONS_KEY);
      return stored ? JSON.parse(stored) : [];
    } catch (error) {
      console.error('Error loading notifications:', error);
      return [];
    }
  }

  saveNotification(notification: Notification): void {
    try {
      const notifications = this.getNotifications();
      notifications.unshift(notification);
      
      // Keep only last 1000 notifications
      if (notifications.length > 1000) {
        notifications.splice(1000);
      }
      
      localStorage.setItem(this.NOTIFICATIONS_KEY, JSON.stringify(notifications));
    } catch (error) {
      console.error('Error saving notification:', error);
    }
  }

  getUserNotifications(userId: string): Notification[] {
    return this.getNotifications().filter(n => n.userId === userId);
  }

  markNotificationAsRead(notificationId: string): void {
    try {
      const notifications = this.getNotifications();
      const notification = notifications.find(n => n.id === notificationId);
      
      if (notification) {
        notification.read = true;
        localStorage.setItem(this.NOTIFICATIONS_KEY, JSON.stringify(notifications));
      }
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  }

  // User stats management
  getUserStats(userId: string): UserStats | null {
    try {
      const stored = localStorage.getItem(`${this.USER_STATS_KEY}_${userId}`);
      return stored ? JSON.parse(stored) : null;
    } catch (error) {
      console.error('Error loading user stats:', error);
      return null;
    }
  }

  saveUserStats(stats: UserStats): void {
    try {
      localStorage.setItem(`${this.USER_STATS_KEY}_${stats.userId}`, JSON.stringify(stats));
    } catch (error) {
      console.error('Error saving user stats:', error);
    }
  }

  updateUserStats(userId: string, updates: Partial<UserStats>): void {
    try {
      const current = this.getUserStats(userId);
      if (current) {
        const updated = { ...current, ...updates };
        this.saveUserStats(updated);
      }
    } catch (error) {
      console.error('Error updating user stats:', error);
    }
  }

  // Training data management
  getTrainingData(): TrainingData[] {
    try {
      const stored = localStorage.getItem(this.TRAINING_DATA_KEY);
      return stored ? JSON.parse(stored) : [];
    } catch (error) {
      console.error('Error loading training data:', error);
      return [];
    }
  }

  saveTrainingData(data: TrainingData): void {
    try {
      const trainingData = this.getTrainingData();
      trainingData.push(data);
      localStorage.setItem(this.TRAINING_DATA_KEY, JSON.stringify(trainingData));
    } catch (error) {
      console.error('Error saving training data:', error);
    }
  }

  getUnusedTrainingData(): TrainingData[] {
    return this.getTrainingData().filter(d => !d.usedInTraining);
  }

  markTrainingDataAsUsed(dataIds: string[]): void {
    try {
      const trainingData = this.getTrainingData();
      trainingData.forEach(data => {
        if (dataIds.includes(data.id)) {
          data.usedInTraining = true;
        }
      });
      localStorage.setItem(this.TRAINING_DATA_KEY, JSON.stringify(trainingData));
    } catch (error) {
      console.error('Error marking training data as used:', error);
    }
  }

  // Model versions management
  getModelVersions(): ModelVersion[] {
    try {
      const stored = localStorage.getItem(this.MODEL_VERSIONS_KEY);
      return stored ? JSON.parse(stored) : [];
    } catch (error) {
      console.error('Error loading model versions:', error);
      return [];
    }
  }

  saveModelVersion(version: ModelVersion): void {
    try {
      const versions = this.getModelVersions();
      
      // Mark previous versions as inactive
      versions.forEach(v => v.isActive = false);
      
      // Add new version
      versions.push(version);
      
      // Keep only last 10 versions
      if (versions.length > 10) {
        versions.splice(0, versions.length - 10);
      }
      
      localStorage.setItem(this.MODEL_VERSIONS_KEY, JSON.stringify(versions));
    } catch (error) {
      console.error('Error saving model version:', error);
    }
  }

  getActiveModelVersion(): ModelVersion | null {
    const versions = this.getModelVersions();
    return versions.find(v => v.isActive) || null;
  }

  // Analytics and insights
  getItemsByCategory(): Record<string, number> {
    const items = this.getItems();
    const categoryCount: Record<string, number> = {};
    
    items.forEach(item => {
      const category = item.category || 'uncategorized';
      categoryCount[category] = (categoryCount[category] || 0) + 1;
    });
    
    return categoryCount;
  }

  getMatchingAccuracy(): number {
    const items = this.getItems();
    const matchedItems = items.filter(i => i.status === 'matched');
    return items.length > 0 ? matchedItems.length / items.length : 0;
  }

  getAverageConfidenceScore(): number {
    const items = this.getItems().filter(i => i.confidenceScore);
    if (items.length === 0) return 0;
    
    const totalConfidence = items.reduce((sum, item) => sum + (item.confidenceScore || 0), 0);
    return totalConfidence / items.length;
  }

  // Data cleanup and maintenance
  cleanupOldData(daysToKeep: number = 30): void {
    try {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - daysToKeep);
      
      // Clean old notifications
      const notifications = this.getNotifications().filter(n => 
        new Date(n.timestamp) > cutoffDate
      );
      localStorage.setItem(this.NOTIFICATIONS_KEY, JSON.stringify(notifications));
      
      // Clean old training data
      const trainingData = this.getTrainingData().filter(d => 
        new Date(d.createdAt) > cutoffDate
      );
      localStorage.setItem(this.TRAINING_DATA_KEY, JSON.stringify(trainingData));
      
      console.log(`Cleaned up data older than ${daysToKeep} days`);
    } catch (error) {
      console.error('Error cleaning up old data:', error);
    }
  }

  // Export/Import functionality
  exportData(): string {
    try {
      const data = {
        items: this.getItems(),
        notifications: this.getNotifications(),
        trainingData: this.getTrainingData(),
        modelVersions: this.getModelVersions(),
        exportDate: new Date().toISOString()
      };
      return JSON.stringify(data, null, 2);
    } catch (error) {
      console.error('Error exporting data:', error);
      return '';
    }
  }

  importData(jsonData: string): boolean {
    try {
      const data = JSON.parse(jsonData);
      
      if (data.items) {
        localStorage.setItem(this.ITEMS_KEY, JSON.stringify(data.items));
      }
      if (data.notifications) {
        localStorage.setItem(this.NOTIFICATIONS_KEY, JSON.stringify(data.notifications));
      }
      if (data.trainingData) {
        localStorage.setItem(this.TRAINING_DATA_KEY, JSON.stringify(data.trainingData));
      }
      if (data.modelVersions) {
        localStorage.setItem(this.MODEL_VERSIONS_KEY, JSON.stringify(data.modelVersions));
      }
      
      return true;
    } catch (error) {
      console.error('Error importing data:', error);
      return false;
    }
  }

  // Initialize with sample data for demo
  initializeSampleData(): void {
    const existingItems = this.getItems();
    if (existingItems.length > 0) return; // Don't override existing data

    const sampleItems: Item[] = [
      {
        id: 'sample_1',
        type: 'lost',
        title: 'Lost iPhone 13 Pro',
        description: 'Black iPhone 13 Pro with blue case, cracked screen protector',
        category: 'electronics',
        imageUrl: '/api/placeholder/300/200',
        location: { name: 'Central Library, 2nd Floor' },
        dateReported: '2024-11-01',
        contactInfo: {
          name: 'John Doe',
          email: 'john@example.com',
          phone: '+1-555-0123'
        },
        status: 'active',
        tags: ['phone', 'electronics', 'apple', 'black'],
        aiClassification: {
          category: 'electronics',
          subcategory: 'smartphone',
          confidence: 0.94,
          features: ['rectangular', 'screen', 'camera', 'ports']
        },
        verificationRequired: false,
        embedding: Array.from({ length: 512 }, () => Math.random() * 2 - 1),
        confidenceScore: 0.94
      },
      {
        id: 'sample_2',
        type: 'found',
        title: 'Found Black Smartphone',
        description: 'Found a black smartphone near the library entrance, has a blue protective case',
        category: 'electronics',
        imageUrl: '/api/placeholder/300/200',
        location: { name: 'Central Library, Main Entrance' },
        dateReported: '2024-11-02',
        contactInfo: {
          name: 'Jane Smith',
          email: 'jane@example.com',
          phone: '+1-555-0456'
        },
        status: 'active',
        tags: ['phone', 'electronics', 'found', 'black'],
        aiClassification: {
          category: 'electronics',
          subcategory: 'smartphone',
          confidence: 0.91,
          features: ['rectangular', 'screen', 'camera', 'case']
        },
        verificationRequired: false,
        embedding: Array.from({ length: 512 }, () => Math.random() * 2 - 1),
        confidenceScore: 0.91
      },
      {
        id: 'sample_3',
        type: 'lost',
        title: 'Lost Blue Backpack',
        description: 'Navy blue Jansport backpack with laptop compartment, has a small tear on the front pocket',
        category: 'bags',
        imageUrl: '/api/placeholder/300/200',
        location: { name: 'Student Center, Food Court' },
        dateReported: '2024-10-30',
        contactInfo: {
          name: 'Mike Johnson',
          email: 'mike@example.com',
          phone: '+1-555-0789'
        },
        status: 'active',
        tags: ['backpack', 'bag', 'blue', 'jansport'],
        aiClassification: {
          category: 'bags',
          subcategory: 'backpack',
          confidence: 0.88,
          features: ['fabric', 'zippers', 'straps', 'compartments']
        },
        verificationRequired: false,
        embedding: Array.from({ length: 512 }, () => Math.random() * 2 - 1),
        confidenceScore: 0.88
      }
    ];

    sampleItems.forEach(item => this.saveItem(item));
    console.log('Sample data initialized');
  }
}

export const enhancedStorage = new EnhancedStorage();

// Backward compatibility exports
export const getItems = () => enhancedStorage.getItems();
export const saveItem = (item: Item) => enhancedStorage.saveItem(item);
export const updateItem = (itemId: string, updates: Partial<Item>) => enhancedStorage.updateItem(itemId, updates);
export const deleteItem = (itemId: string) => enhancedStorage.deleteItem(itemId);
export const getUserNotifications = (userId: string) => enhancedStorage.getUserNotifications(userId);
export const getUserId = () => 'user@example.com'; // Demo user ID
export const initializeSampleData = () => enhancedStorage.initializeSampleData();