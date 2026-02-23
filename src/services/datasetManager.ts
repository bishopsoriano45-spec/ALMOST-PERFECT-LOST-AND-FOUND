import { VerifiedSample, DatasetStats, DetectedObject } from '@/types/autoLearning';

class DatasetManager {
  private samples: VerifiedSample[] = [];
  private duplicateHashes: Set<string> = new Set();

  constructor() {
    this.loadFromStorage();
    this.initializeMockData();
  }

  // Load data from localStorage
  private loadFromStorage(): void {
    const stored = localStorage.getItem('datasetSamples');
    if (stored) {
      try {
        this.samples = JSON.parse(stored);
      } catch (error) {
        console.error('Failed to load dataset from storage:', error);
      }
    }
  }

  // Save data to localStorage
  private saveToStorage(): void {
    try {
      localStorage.setItem('datasetSamples', JSON.stringify(this.samples));
    } catch (error) {
      console.error('Failed to save dataset to storage:', error);
    }
  }

  // Initialize with mock data for demonstration
  private initializeMockData(): void {
    if (this.samples.length === 0) {
      const categories = ['Bags & Accessories', 'Electronics', 'Personal Items', 'Clothing', 'Sports & Recreation'];
      const objects = ['backpack', 'laptop', 'phone', 'keys', 'wallet', 'sunglasses', 'watch', 'headphones'];
      
      for (let i = 0; i < 200; i++) {
        const category = categories[i % categories.length];
        const objectClass = objects[i % objects.length];
        
        const sample: VerifiedSample = {
          id: `dataset_${i}`,
          imageUrl: `/mock-dataset/image_${i}.jpg`,
          originalDetection: [{
            class: objectClass,
            confidence: 0.6 + Math.random() * 0.3,
            bbox: {
              x: Math.floor(Math.random() * 200),
              y: Math.floor(Math.random() * 200),
              width: 100 + Math.floor(Math.random() * 100),
              height: 100 + Math.floor(Math.random() * 100)
            }
          }],
          correctedDetection: [{
            class: Math.random() > 0.8 ? objects[(i + 1) % objects.length] : objectClass, // 20% corrections
            confidence: 0.9 + Math.random() * 0.1,
            bbox: {
              x: Math.floor(Math.random() * 200),
              y: Math.floor(Math.random() * 200),
              width: 100 + Math.floor(Math.random() * 100),
              height: 100 + Math.floor(Math.random() * 100)
            }
          }],
          userFeedback: {
            detectionCorrections: [],
            qualityRating: 3 + Math.random() * 2,
            timestamp: new Date(Date.now() - Math.random() * 90 * 24 * 60 * 60 * 1000).toISOString()
          },
          verificationStatus: Math.random() > 0.1 ? 'verified' : 'pending',
          qualityScore: 0.7 + Math.random() * 0.3,
          timestamp: new Date(Date.now() - Math.random() * 90 * 24 * 60 * 60 * 1000).toISOString(),
          userId: `user_${Math.floor(Math.random() * 100)}`,
          category
        };
        
        this.samples.push(sample);
        this.duplicateHashes.add(this.generateImageHash(sample.imageUrl));
      }
      
      this.saveToStorage();
    }
  }

  // Add new sample to dataset
  async addSample(sample: Omit<VerifiedSample, 'id' | 'timestamp'>): Promise<string> {
    // Check for duplicates
    const imageHash = this.generateImageHash(sample.imageUrl);
    if (this.duplicateHashes.has(imageHash)) {
      throw new Error('Duplicate image detected');
    }

    // Validate sample quality
    const qualityScore = await this.validateSampleQuality(sample);
    if (qualityScore < 0.5) {
      throw new Error('Sample quality too low');
    }

    const id = `sample_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const newSample: VerifiedSample = {
      ...sample,
      id,
      timestamp: new Date().toISOString(),
      qualityScore
    };

    this.samples.push(newSample);
    this.duplicateHashes.add(imageHash);
    this.saveToStorage();

    return id;
  }

  // Validate sample quality
  private async validateSampleQuality(sample: Omit<VerifiedSample, 'id' | 'timestamp'>): Promise<number> {
    let score = 0.5; // Base score

    // Check detection confidence
    const avgConfidence = sample.originalDetection.reduce((sum, obj) => sum + obj.confidence, 0) / sample.originalDetection.length;
    score += avgConfidence * 0.3;

    // Check user feedback quality
    if (sample.userFeedback.qualityRating >= 4) {
      score += 0.2;
    }

    // Check if corrections were needed
    if (sample.userFeedback.detectionCorrections.length === 0) {
      score += 0.1;
    }

    // Check bounding box validity
    const validBboxes = sample.originalDetection.every(obj => 
      obj.bbox.width > 10 && obj.bbox.height > 10 && 
      obj.bbox.x >= 0 && obj.bbox.y >= 0
    );
    if (validBboxes) {
      score += 0.1;
    }

    return Math.min(1.0, score);
  }

  // Generate simple hash for duplicate detection
  private generateImageHash(imageUrl: string): string {
    // Simple hash based on URL - in real implementation, use perceptual hashing
    let hash = 0;
    for (let i = 0; i < imageUrl.length; i++) {
      const char = imageUrl.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return hash.toString();
  }

  // Get samples by verification status
  async getSamplesByStatus(status: 'pending' | 'verified' | 'rejected'): Promise<VerifiedSample[]> {
    return this.samples.filter(sample => sample.verificationStatus === status);
  }

  // Get samples by category
  async getSamplesByCategory(category: string): Promise<VerifiedSample[]> {
    return this.samples.filter(sample => sample.category === category);
  }

  // Get samples by date range
  async getSamplesByDateRange(startDate: string, endDate: string): Promise<VerifiedSample[]> {
    const start = new Date(startDate).getTime();
    const end = new Date(endDate).getTime();
    
    return this.samples.filter(sample => {
      const sampleTime = new Date(sample.timestamp).getTime();
      return sampleTime >= start && sampleTime <= end;
    });
  }

  // Update sample verification status
  async updateSampleStatus(sampleId: string, status: 'pending' | 'verified' | 'rejected'): Promise<void> {
    const sample = this.samples.find(s => s.id === sampleId);
    if (sample) {
      sample.verificationStatus = status;
      this.saveToStorage();
    }
  }

  // Remove sample from dataset
  async removeSample(sampleId: string): Promise<void> {
    const index = this.samples.findIndex(s => s.id === sampleId);
    if (index !== -1) {
      const sample = this.samples[index];
      this.duplicateHashes.delete(this.generateImageHash(sample.imageUrl));
      this.samples.splice(index, 1);
      this.saveToStorage();
    }
  }

  // Get dataset statistics
  async getDatasetStats(): Promise<DatasetStats> {
    const totalImages = this.samples.length;
    const verifiedImages = this.samples.filter(s => s.verificationStatus === 'verified').length;
    
    // Calculate unique categories
    const categories = new Set(this.samples.map(s => s.category));
    const categoriesCount = categories.size;
    
    // Calculate average quality score
    const avgQualityScore = this.samples.reduce((sum, s) => sum + s.qualityScore, 0) / totalImages;
    
    // Calculate recent additions (last 7 days)
    const weekAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
    const recentAdditions = this.samples.filter(s => new Date(s.timestamp).getTime() > weekAgo).length;
    
    // Mock storage calculation
    const storageUsed = `${(totalImages * 2.5).toFixed(1)} MB`; // Rough estimate
    
    return {
      totalImages,
      verifiedImages,
      categoriesCount,
      avgQualityScore: Math.round(avgQualityScore * 100) / 100,
      recentAdditions,
      duplicatesRemoved: Math.floor(totalImages * 0.05), // Mock 5% duplicates removed
      storageUsed
    };
  }

  // Balance dataset by category
  async balanceDataset(maxSamplesPerCategory: number = 1000): Promise<void> {
    const categoryGroups = new Map<string, VerifiedSample[]>();
    
    // Group samples by category
    this.samples.forEach(sample => {
      if (!categoryGroups.has(sample.category)) {
        categoryGroups.set(sample.category, []);
      }
      categoryGroups.get(sample.category)!.push(sample);
    });
    
    // Balance each category
    const balancedSamples: VerifiedSample[] = [];
    
    categoryGroups.forEach((samples, category) => {
      // Sort by quality score (highest first)
      samples.sort((a, b) => b.qualityScore - a.qualityScore);
      
      // Take top samples up to the limit
      const selectedSamples = samples.slice(0, maxSamplesPerCategory);
      balancedSamples.push(...selectedSamples);
    });
    
    this.samples = balancedSamples;
    this.saveToStorage();
  }

  // Export dataset for training
  async exportDataset(format: 'json' | 'csv' | 'yolo' = 'json'): Promise<string> {
    const verifiedSamples = this.samples.filter(s => s.verificationStatus === 'verified');
    
    switch (format) {
      case 'json': {
        return JSON.stringify(verifiedSamples, null, 2);
      }
      
      case 'csv': {
        const headers = ['id', 'imageUrl', 'category', 'class', 'confidence', 'bbox_x', 'bbox_y', 'bbox_width', 'bbox_height', 'qualityScore'];
        const rows = verifiedSamples.flatMap(sample => 
          sample.correctedDetection.map(obj => [
            sample.id,
            sample.imageUrl,
            sample.category,
            obj.class,
            obj.confidence,
            obj.bbox.x,
            obj.bbox.y,
            obj.bbox.width,
            obj.bbox.height,
            sample.qualityScore
          ])
        );
        return [headers, ...rows].map(row => row.join(',')).join('\n');
      }
      
      case 'yolo': {
        // YOLO format annotation
        const yoloData = verifiedSamples.map(sample => ({
          image: sample.imageUrl,
          annotations: sample.correctedDetection.map(obj => ({
            class: obj.class,
            bbox: [obj.bbox.x, obj.bbox.y, obj.bbox.width, obj.bbox.height],
            confidence: obj.confidence
          }))
        }));
        return JSON.stringify(yoloData, null, 2);
      }
      
      default:
        return JSON.stringify(verifiedSamples, null, 2);
    }
  }

  // Import dataset
  async importDataset(data: string, format: 'json' | 'csv' = 'json'): Promise<number> {
    let importedSamples: VerifiedSample[] = [];
    
    try {
      if (format === 'json') {
        importedSamples = JSON.parse(data);
      } else if (format === 'csv') {
        // Parse CSV format
        const lines = data.split('\n');
        const headers = lines[0].split(',');
        
        for (let i = 1; i < lines.length; i++) {
          const values = lines[i].split(',');
          if (values.length >= headers.length) {
            // Create sample from CSV row (simplified)
            const sample: VerifiedSample = {
              id: values[0],
              imageUrl: values[1],
              category: values[2],
              originalDetection: [],
              correctedDetection: [{
                class: values[3],
                confidence: parseFloat(values[4]),
                bbox: {
                  x: parseInt(values[5]),
                  y: parseInt(values[6]),
                  width: parseInt(values[7]),
                  height: parseInt(values[8])
                }
              }],
              userFeedback: {
                detectionCorrections: [],
                qualityRating: 4,
                timestamp: new Date().toISOString()
              },
              verificationStatus: 'verified',
              qualityScore: parseFloat(values[9]),
              timestamp: new Date().toISOString(),
              userId: 'imported'
            };
            importedSamples.push(sample);
          }
        }
      }
      
      // Add imported samples
      let addedCount = 0;
      for (const sample of importedSamples) {
        try {
          await this.addSample(sample);
          addedCount++;
        } catch (error) {
          console.warn(`Failed to import sample ${sample.id}:`, error);
        }
      }
      
      return addedCount;
    } catch (error) {
      console.error('Failed to import dataset:', error);
      throw new Error('Invalid dataset format');
    }
  }

  // Get sample by ID
  async getSampleById(sampleId: string): Promise<VerifiedSample | null> {
    return this.samples.find(s => s.id === sampleId) || null;
  }

  // Search samples
  async searchSamples(query: {
    category?: string;
    objectClass?: string;
    minQuality?: number;
    status?: 'pending' | 'verified' | 'rejected';
    dateRange?: [string, string];
  }): Promise<VerifiedSample[]> {
    return this.samples.filter(sample => {
      // Category filter
      if (query.category && sample.category !== query.category) {
        return false;
      }
      
      // Object class filter
      if (query.objectClass) {
        const hasClass = sample.correctedDetection.some(obj => 
          obj.class.toLowerCase().includes(query.objectClass!.toLowerCase())
        );
        if (!hasClass) return false;
      }
      
      // Quality filter
      if (query.minQuality && sample.qualityScore < query.minQuality) {
        return false;
      }
      
      // Status filter
      if (query.status && sample.verificationStatus !== query.status) {
        return false;
      }
      
      // Date range filter
      if (query.dateRange) {
        const sampleTime = new Date(sample.timestamp).getTime();
        const [start, end] = query.dateRange.map(d => new Date(d).getTime());
        if (sampleTime < start || sampleTime > end) {
          return false;
        }
      }
      
      return true;
    });
  }
}

export const datasetManager = new DatasetManager();