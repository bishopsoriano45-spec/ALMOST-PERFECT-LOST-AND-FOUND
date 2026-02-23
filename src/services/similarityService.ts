import { DetectedObject, SimilarityMatch, HierarchicalSearchResult } from '@/types/autoLearning';
import { Item } from '@/types/item';

class SimilarityService {
  private mockEmbeddings: Map<string, number[]> = new Map();
  private mockItems: Item[] = [];

  constructor() {
    this.initializeMockData();
  }

  // Initialize mock data for demonstration
  private initializeMockData(): void {
    // Generate mock items with embeddings
    const categories = ['Bags & Accessories', 'Electronics', 'Personal Items', 'Clothing', 'Sports & Recreation'];
    const objects = ['backpack', 'laptop', 'phone', 'keys', 'wallet', 'sunglasses', 'watch', 'headphones'];
    
    for (let i = 0; i < 100; i++) {
      const item: Item = {
        id: `item_${i}`,
        title: `Lost ${objects[i % objects.length]} #${i}`,
        description: `A ${objects[i % objects.length]} found near the campus`,
        category: categories[i % categories.length],
        type: Math.random() > 0.5 ? 'lost' : 'found',
        location: `Location ${Math.floor(i / 10) + 1}`,
        dateReported: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        contactInfo: {
          name: `User ${i}`,
          email: `user${i}@example.com`,
          phone: `+1-555-${String(i).padStart(4, '0')}`
        },
        images: [`/mock-images/item_${i}.jpg`],
        detectedObjects: [{
          class: objects[i % objects.length],
          confidence: 0.8 + Math.random() * 0.2,
          bbox: { x: 100, y: 100, width: 200, height: 200 }
        }],
        status: 'active',
        tags: [`tag_${Math.floor(Math.random() * 10)}`],
        createdAt: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000).toISOString(),
        updatedAt: new Date().toISOString()
      };
      
      this.mockItems.push(item);
      
      // Generate mock embedding (512-dimensional)
      const embedding = Array.from({ length: 512 }, () => Math.random() * 2 - 1);
      this.mockEmbeddings.set(item.id, embedding);
    }
  }

  // Hierarchical similarity search
  async hierarchicalSearch(
    detectedObjects: DetectedObject[],
    queryEmbedding?: number[],
    metadata?: { location?: string; dateRange?: [string, string]; category?: string }
  ): Promise<HierarchicalSearchResult> {
    const startTime = Date.now();
    
    // Level 1: Class-based matching (within same detected objects)
    const classMatches = await this.findClassMatches(detectedObjects);
    
    // Level 2: Visual similarity matching (using embeddings)
    const visualMatches = await this.findVisualMatches(queryEmbedding || this.generateMockEmbedding());
    
    // Level 3: Metadata matching (location, time, category)
    const metadataMatches = await this.findMetadataMatches(metadata);
    
    // Combine results with weighted scoring
    const compositeScore = this.calculateCompositeScore(classMatches, visualMatches, metadataMatches);
    
    const searchTime = Date.now() - startTime;
    
    return {
      classMatches: classMatches.slice(0, 5),
      visualMatches: visualMatches.slice(0, 5),
      metadataMatches: metadataMatches.slice(0, 5),
      compositeScore,
      searchTime
    };
  }

  // Find matches based on detected object classes
  private async findClassMatches(detectedObjects: DetectedObject[]): Promise<SimilarityMatch[]> {
    const matches: SimilarityMatch[] = [];
    const detectedClasses = detectedObjects.map(obj => obj.class.toLowerCase());
    
    this.mockItems.forEach(item => {
      if (item.detectedObjects) {
        const itemClasses = item.detectedObjects.map(obj => obj.class.toLowerCase());
        const intersection = detectedClasses.filter(cls => itemClasses.includes(cls));
        
        if (intersection.length > 0) {
          const similarity = intersection.length / Math.max(detectedClasses.length, itemClasses.length);
          const avgConfidence = item.detectedObjects
            .filter(obj => intersection.includes(obj.class.toLowerCase()))
            .reduce((sum, obj) => sum + obj.confidence, 0) / intersection.length;
          
          matches.push({
            itemId: item.id,
            similarity,
            matchType: 'class_match',
            confidence: avgConfidence,
            explanation: `Matched objects: ${intersection.join(', ')}`
          });
        }
      }
    });
    
    return matches
      .sort((a, b) => b.similarity - a.similarity)
      .slice(0, 10);
  }

  // Find matches based on visual similarity (embeddings)
  private async findVisualMatches(queryEmbedding: number[]): Promise<SimilarityMatch[]> {
    const matches: SimilarityMatch[] = [];
    
    this.mockEmbeddings.forEach((embedding, itemId) => {
      const similarity = this.cosineSimilarity(queryEmbedding, embedding);
      
      if (similarity > 0.5) { // Threshold for visual similarity
        matches.push({
          itemId,
          similarity,
          matchType: 'visual_match',
          confidence: similarity,
          explanation: `Visual similarity: ${(similarity * 100).toFixed(1)}%`
        });
      }
    });
    
    return matches
      .sort((a, b) => b.similarity - a.similarity)
      .slice(0, 10);
  }

  // Find matches based on metadata (location, time, category)
  private async findMetadataMatches(metadata?: {
    location?: string;
    dateRange?: [string, string];
    category?: string;
  }): Promise<SimilarityMatch[]> {
    if (!metadata) return [];
    
    const matches: SimilarityMatch[] = [];
    
    this.mockItems.forEach(item => {
      let score = 0;
      const matchFactors: string[] = [];
      
      // Location matching
      if (metadata.location && item.location) {
        const locationSimilarity = this.calculateLocationSimilarity(metadata.location, item.location);
        if (locationSimilarity > 0.5) {
          score += locationSimilarity * 0.4;
          matchFactors.push(`location (${(locationSimilarity * 100).toFixed(0)}%)`);
        }
      }
      
      // Date range matching
      if (metadata.dateRange && item.dateReported) {
        const dateSimilarity = this.calculateDateSimilarity(metadata.dateRange, item.dateReported);
        if (dateSimilarity > 0.3) {
          score += dateSimilarity * 0.3;
          matchFactors.push(`date (${(dateSimilarity * 100).toFixed(0)}%)`);
        }
      }
      
      // Category matching
      if (metadata.category && item.category) {
        if (metadata.category === item.category) {
          score += 0.3;
          matchFactors.push('category (exact)');
        }
      }
      
      if (score > 0.3) {
        matches.push({
          itemId: item.id,
          similarity: score,
          matchType: 'metadata_match',
          confidence: score,
          explanation: `Matched: ${matchFactors.join(', ')}`
        });
      }
    });
    
    return matches
      .sort((a, b) => b.similarity - a.similarity)
      .slice(0, 10);
  }

  // Calculate composite score from all match types
  private calculateCompositeScore(
    classMatches: SimilarityMatch[],
    visualMatches: SimilarityMatch[],
    metadataMatches: SimilarityMatch[]
  ): number {
    const weights = {
      class: 0.4,
      visual: 0.3,
      metadata: 0.3
    };
    
    const classScore = classMatches.length > 0 ? classMatches[0].similarity : 0;
    const visualScore = visualMatches.length > 0 ? visualMatches[0].similarity : 0;
    const metadataScore = metadataMatches.length > 0 ? metadataMatches[0].similarity : 0;
    
    return (classScore * weights.class + visualScore * weights.visual + metadataScore * weights.metadata);
  }

  // Calculate cosine similarity between two embeddings
  private cosineSimilarity(a: number[], b: number[]): number {
    if (a.length !== b.length) return 0;
    
    let dotProduct = 0;
    let normA = 0;
    let normB = 0;
    
    for (let i = 0; i < a.length; i++) {
      dotProduct += a[i] * b[i];
      normA += a[i] * a[i];
      normB += b[i] * b[i];
    }
    
    return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
  }

  // Calculate location similarity (mock implementation)
  private calculateLocationSimilarity(loc1: string, loc2: string): number {
    if (loc1.toLowerCase() === loc2.toLowerCase()) return 1.0;
    
    // Simple string similarity for demo
    const words1 = loc1.toLowerCase().split(' ');
    const words2 = loc2.toLowerCase().split(' ');
    const intersection = words1.filter(word => words2.includes(word));
    
    return intersection.length / Math.max(words1.length, words2.length);
  }

  // Calculate date similarity based on proximity
  private calculateDateSimilarity(dateRange: [string, string], itemDate: string): number {
    const [startDate, endDate] = dateRange.map(d => new Date(d).getTime());
    const itemTime = new Date(itemDate).getTime();
    
    if (itemTime >= startDate && itemTime <= endDate) {
      return 1.0; // Perfect match within range
    }
    
    // Calculate proximity score
    const daysDiff = Math.min(
      Math.abs(itemTime - startDate),
      Math.abs(itemTime - endDate)
    ) / (24 * 60 * 60 * 1000);
    
    return Math.max(0, 1 - daysDiff / 30); // Decay over 30 days
  }

  // Generate mock embedding for testing
  private generateMockEmbedding(): number[] {
    return Array.from({ length: 512 }, () => Math.random() * 2 - 1);
  }

  // Get item details by ID
  async getItemById(itemId: string): Promise<Item | null> {
    return this.mockItems.find(item => item.id === itemId) || null;
  }

  // Update item embedding
  async updateItemEmbedding(itemId: string, embedding: number[]): Promise<void> {
    this.mockEmbeddings.set(itemId, embedding);
  }

  // Regenerate all embeddings (simulation)
  async regenerateEmbeddings(): Promise<void> {
    console.log('Regenerating embeddings for all items...');
    
    // Simulate embedding regeneration process
    for (const item of this.mockItems) {
      await new Promise(resolve => setTimeout(resolve, 10)); // Simulate processing time
      
      // Generate new embedding with slight variation
      const currentEmbedding = this.mockEmbeddings.get(item.id) || this.generateMockEmbedding();
      const newEmbedding = currentEmbedding.map(val => val + (Math.random() - 0.5) * 0.1);
      
      this.mockEmbeddings.set(item.id, newEmbedding);
    }
    
    console.log('Embedding regeneration completed');
  }

  // Rebuild search index (FAISS simulation)
  async rebuildSearchIndex(): Promise<void> {
    console.log('Rebuilding FAISS search index...');
    
    // Simulate index rebuilding
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    console.log('Search index rebuilt successfully');
  }

  // Get similarity statistics
  async getSimilarityStats(): Promise<{
    totalEmbeddings: number;
    avgSimilarity: number;
    indexSize: string;
    lastUpdated: string;
  }> {
    const totalEmbeddings = this.mockEmbeddings.size;
    const avgSimilarity = 0.75 + Math.random() * 0.2; // Mock average
    const indexSize = `${(totalEmbeddings * 512 * 4 / 1024 / 1024).toFixed(1)} MB`; // Rough calculation
    const lastUpdated = new Date().toISOString();
    
    return {
      totalEmbeddings,
      avgSimilarity,
      indexSize,
      lastUpdated
    };
  }
}

export const similarityService = new SimilarityService();