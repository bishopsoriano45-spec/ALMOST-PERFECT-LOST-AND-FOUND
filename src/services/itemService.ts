import { Item, SearchFilters } from '@/types/item';
import { apiRequest } from '@/lib/api';

class ItemService {
  // FIX: Create item with proper FormData for file upload
  async createItem(itemData: Omit<Item, 'id' | 'createdAt' | 'updatedAt'>, imageFile?: File, userId?: string): Promise<Item> {
    const endpoint = itemData.type === 'lost' ? '/items/lost' : '/items/found';

    // FIX: Use FormData instead of JSON to support file uploads
    const formData = new FormData();

    // Append image file if provided
    if (imageFile) {
      formData.append('image', imageFile);
    }

    // Append all other fields
    formData.append('title', itemData.title);
    formData.append('description', itemData.description);
    formData.append('category', itemData.category);

    // Handle location - backend expects string
    if (typeof itemData.location === 'object' && itemData.location.name) {
      formData.append('location', itemData.location.name);
    } else if (typeof itemData.location === 'string') {
      formData.append('location', itemData.location);
    }

    // Add optional fields
    if (itemData.dateReported) {
      formData.append(itemData.type === 'lost' ? 'date_lost' : 'date_found', itemData.dateReported);
    }

    // Use provided userId or fallback to guest
    formData.append('user_id', userId || 'guest');

    if (itemData.contactInfo) {
      // contactInfo.email is just for contact, not user_id
      // We already appended user_id above
    }

    // Add AI metadata if available
    if ((itemData as any).tags) {
      formData.append('tags', JSON.stringify((itemData as any).tags));
    }

    if ((itemData as any).embedding) {
      formData.append('embedding', JSON.stringify((itemData as any).embedding));
    }

    if ((itemData as any).ai_metadata) {
      formData.append('ai_metadata', JSON.stringify((itemData as any).ai_metadata));
    }

    // FIX: Send FormData without Content-Type header (browser sets it with boundary)
    return apiRequest<Item>(endpoint, {
      method: 'POST',
      body: formData
      // Don't set Content-Type - browser will set it with multipart boundary
    });
  }

  // Update an existing item
  async updateItem(itemId: string, updates: Partial<Item>): Promise<Item> {
    return apiRequest<Item>(`/items/${itemId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updates)
    });
  }

  // Delete an item
  async deleteItem(itemId: string): Promise<void> {
    await apiRequest<void>(`/items/${itemId}`, {
      method: 'DELETE'
    });
  }

  // Get item by ID
  async getItemById(itemId: string): Promise<Item | null> {
    try {
      return await apiRequest<Item>(`/items/${itemId}`);
    } catch (e) {
      return null;
    }
  }

  // Search items with filters
  async searchItems(filters: SearchFilters = {}): Promise<Item[]> {
    const params = new URLSearchParams();
    if (filters.type && filters.type !== 'all') params.append('type', filters.type);
    if (filters.searchQuery) params.append('query', filters.searchQuery);
    if (filters.category && filters.category !== 'all') params.append('category', filters.category);
    if (filters.status && filters.status !== 'all') params.append('status', filters.status);
    if (filters.location) params.append('location', filters.location);

    return apiRequest<Item[]>(`/items?${params.toString()}`);
  }

  // Get all items
  async getAllItems(): Promise<Item[]> {
    return apiRequest<Item[]>('/items');
  }

  // Mark item as resolved
  async markAsResolved(itemId: string): Promise<Item> {
    return this.updateItem(itemId, { status: 'resolved' });
  }

  // Get statistics for dashboard
  async getStatistics() {
    return {
      totalItems: 0,
      resolvedItems: 0,
      totalLost: 0,
      totalFound: 0
    };
  }

  // Get recent items
  async getRecentItems(limit: number = 10): Promise<Item[]> {
    return apiRequest<Item[]>('/items/recent');
  }

  // Get matching items (for suggesting potential matches)
  async getMatchingItems(item: Item): Promise<Item[]> {
    // TODO: Implement AI matching endpoint
    return [];
  }

  // Initialize sample data
  initializeSampleData(): void {
    // No-op for API
  }

  // Get items by user ID
  async getUserItems(userId: string): Promise<Item[]> {
    return apiRequest<Item[]>(`/items?user_id=${encodeURIComponent(userId)}`);
  }
}

export const itemService = new ItemService();