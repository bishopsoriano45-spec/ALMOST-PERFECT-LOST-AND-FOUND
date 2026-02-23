import { 
  VerifiedSample, 
  LearningMetrics, 
  RetrainingTrigger, 
  ModelVersion, 
  LearningProgress,
  AutoLearningConfig,
  UserFeedback,
  DetectedObject
} from '@/types/autoLearning';

class AutoLearningService {
  private config: AutoLearningConfig = {
    retrainingThreshold: 500,
    qualityThreshold: 0.8,
    maxSamplesPerCategory: 1000,
    scheduledRetrainingInterval: 'weekly',
    confidenceThreshold: 0.85,
    enableAutoRetraining: true,
    enableQualityFiltering: true
  };

  private verifiedSamples: VerifiedSample[] = [];
  private retrainingTriggers: RetrainingTrigger[] = [];
  private modelVersions: ModelVersion[] = [];
  private learningProgress: LearningProgress = {
    currentPhase: 'data_collection',
    progress: 0,
    estimatedCompletion: '',
    currentTask: 'Collecting verified samples',
    logs: []
  };

  constructor() {
    this.initializeMockData();
    this.startBackgroundScheduler();
  }

  // Initialize with mock data for demonstration
  private initializeMockData(): void {
    // Mock verified samples
    for (let i = 0; i < 150; i++) {
      this.verifiedSamples.push({
        id: `sample_${i}`,
        imageUrl: `/mock-images/sample_${i}.jpg`,
        originalDetection: [{
          class: 'backpack',
          confidence: 0.75 + Math.random() * 0.2,
          bbox: { x: 100, y: 100, width: 200, height: 200 }
        }],
        correctedDetection: [{
          class: 'handbag',
          confidence: 0.95,
          bbox: { x: 100, y: 100, width: 200, height: 200 }
        }],
        userFeedback: {
          detectionCorrections: [],
          qualityRating: 4 + Math.random(),
          timestamp: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000).toISOString()
        },
        verificationStatus: 'verified',
        qualityScore: 0.8 + Math.random() * 0.2,
        timestamp: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000).toISOString(),
        userId: `user_${Math.floor(Math.random() * 50)}`,
        category: ['Bags & Accessories', 'Electronics', 'Personal Items'][Math.floor(Math.random() * 3)]
      });
    }

    // Mock model versions
    this.modelVersions = [
      {
        version: 'v1.0.0',
        accuracy: 0.87,
        trainingDate: '2024-01-15',
        sampleCount: 10000,
        improvements: ['Initial YOLOv8m deployment'],
        status: 'archived'
      },
      {
        version: 'v1.1.0',
        accuracy: 0.91,
        trainingDate: '2024-02-15',
        sampleCount: 15000,
        improvements: ['Added user feedback integration', 'Improved small object detection'],
        status: 'archived'
      },
      {
        version: 'v1.2.0',
        accuracy: 0.94,
        trainingDate: '2024-03-15',
        sampleCount: 20000,
        improvements: ['Hierarchical similarity search', 'Enhanced confidence calibration'],
        status: 'active'
      }
    ];

    // Mock retraining triggers
    this.retrainingTriggers = [
      {
        id: 'trigger_1',
        triggerType: 'threshold',
        threshold: 500,
        currentValue: 487,
        status: 'pending',
        timestamp: new Date().toISOString(),
        description: 'Approaching verified samples threshold for retraining'
      },
      {
        id: 'trigger_2',
        triggerType: 'scheduled',
        threshold: 7,
        currentValue: 5,
        status: 'pending',
        timestamp: new Date().toISOString(),
        description: 'Weekly scheduled retraining in 2 days'
      }
    ];
  }

  // Background scheduler simulation
  private startBackgroundScheduler(): void {
    setInterval(() => {
      this.checkRetrainingTriggers();
      this.updateLearningProgress();
    }, 5000); // Check every 5 seconds for demo purposes
  }

  // Check if retraining should be triggered
  private checkRetrainingTriggers(): void {
    const verifiedCount = this.verifiedSamples.filter(s => s.verificationStatus === 'verified').length;
    
    // Update threshold trigger
    const thresholdTrigger = this.retrainingTriggers.find(t => t.triggerType === 'threshold');
    if (thresholdTrigger) {
      thresholdTrigger.currentValue = verifiedCount;
      
      if (verifiedCount >= this.config.retrainingThreshold && thresholdTrigger.status === 'pending') {
        thresholdTrigger.status = 'triggered';
        this.triggerRetraining('threshold');
      }
    }
  }

  // Trigger retraining process
  private async triggerRetraining(triggerType: string): Promise<void> {
    this.learningProgress = {
      currentPhase: 'training',
      progress: 0,
      estimatedCompletion: new Date(Date.now() + 4 * 60 * 60 * 1000).toISOString(), // 4 hours
      currentTask: 'Preparing training data',
      logs: [`Retraining triggered by ${triggerType}`, 'Validating dataset quality', 'Initializing training pipeline']
    };

    // Simulate training progress
    const progressInterval = setInterval(() => {
      this.learningProgress.progress += Math.random() * 10;
      
      if (this.learningProgress.progress >= 100) {
        clearInterval(progressInterval);
        this.completeRetraining();
      } else {
        // Update current task based on progress
        if (this.learningProgress.progress < 20) {
          this.learningProgress.currentTask = 'Preparing training data';
        } else if (this.learningProgress.progress < 60) {
          this.learningProgress.currentTask = 'Training YOLOv8m model';
        } else if (this.learningProgress.progress < 90) {
          this.learningProgress.currentTask = 'Validating model performance';
        } else {
          this.learningProgress.currentTask = 'Deploying updated model';
        }
      }
    }, 2000);
  }

  // Complete retraining process
  private completeRetraining(): void {
    const newVersion = `v1.${this.modelVersions.length}.0`;
    const newAccuracy = Math.min(0.98, this.getCurrentAccuracy() + 0.01 + Math.random() * 0.02);
    
    this.modelVersions.push({
      version: newVersion,
      accuracy: newAccuracy,
      trainingDate: new Date().toISOString().split('T')[0],
      sampleCount: this.verifiedSamples.length,
      improvements: [
        'Incorporated latest user feedback',
        'Enhanced object detection accuracy',
        'Improved confidence calibration'
      ],
      status: 'active'
    });

    // Mark previous version as archived
    const previousActive = this.modelVersions.find(v => v.status === 'active' && v.version !== newVersion);
    if (previousActive) {
      previousActive.status = 'archived';
    }

    this.learningProgress = {
      currentPhase: 'deployment',
      progress: 100,
      estimatedCompletion: new Date().toISOString(),
      currentTask: 'Retraining completed successfully',
      logs: [
        ...this.learningProgress.logs,
        `Model ${newVersion} deployed with ${(newAccuracy * 100).toFixed(1)}% accuracy`,
        'Regenerating embeddings for similarity search',
        'Rebuilding FAISS index',
        'Deployment completed successfully'
      ]
    };

    // Reset triggers
    this.retrainingTriggers.forEach(trigger => {
      if (trigger.status === 'triggered') {
        trigger.status = 'completed';
      }
    });

    // Reset to data collection phase after a delay
    setTimeout(() => {
      this.learningProgress.currentPhase = 'data_collection';
      this.learningProgress.progress = 0;
      this.learningProgress.currentTask = 'Collecting verified samples';
    }, 5000);
  }

  // Update learning progress
  private updateLearningProgress(): void {
    if (this.learningProgress.currentPhase === 'data_collection') {
      const verifiedCount = this.verifiedSamples.filter(s => s.verificationStatus === 'verified').length;
      this.learningProgress.progress = Math.min(100, (verifiedCount / this.config.retrainingThreshold) * 100);
    }
  }

  // Add verified sample
  async addVerifiedSample(sample: Omit<VerifiedSample, 'id' | 'timestamp'>): Promise<string> {
    const id = `sample_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const verifiedSample: VerifiedSample = {
      ...sample,
      id,
      timestamp: new Date().toISOString()
    };

    this.verifiedSamples.push(verifiedSample);
    
    // Store in localStorage for persistence
    localStorage.setItem('verifiedSamples', JSON.stringify(this.verifiedSamples));
    
    return id;
  }

  // Process user feedback
  async processFeedback(itemId: string, feedback: UserFeedback): Promise<void> {
    const sample = this.verifiedSamples.find(s => s.id === itemId);
    if (sample) {
      sample.userFeedback = feedback;
      sample.verificationStatus = 'verified';
      
      // Update quality score based on feedback
      sample.qualityScore = this.calculateQualityScore(feedback);
      
      localStorage.setItem('verifiedSamples', JSON.stringify(this.verifiedSamples));
    }
  }

  // Calculate quality score based on feedback
  private calculateQualityScore(feedback: UserFeedback): number {
    let score = feedback.qualityRating / 5; // Base score from rating
    
    // Adjust based on corrections
    if (feedback.detectionCorrections.length === 0) {
      score += 0.1; // Bonus for no corrections needed
    } else {
      score -= feedback.detectionCorrections.length * 0.05; // Penalty for corrections
    }
    
    return Math.max(0, Math.min(1, score));
  }

  // Get learning metrics
  async getLearningMetrics(): Promise<LearningMetrics> {
    const verifiedSamples = this.verifiedSamples.filter(s => s.verificationStatus === 'verified');
    const pendingSamples = this.verifiedSamples.filter(s => s.verificationStatus === 'pending');
    
    // Calculate category performance
    const categoryStats = new Map<string, { total: number; avgQuality: number; corrections: number }>();
    
    verifiedSamples.forEach(sample => {
      const category = sample.category;
      const stats = categoryStats.get(category) || { total: 0, avgQuality: 0, corrections: 0 };
      stats.total++;
      stats.avgQuality += sample.qualityScore;
      stats.corrections += sample.userFeedback.detectionCorrections.length;
      categoryStats.set(category, stats);
    });

    const categoryPerformance = Array.from(categoryStats.entries()).map(([category, stats]) => ({
      category,
      accuracy: Math.max(0.7, 1 - (stats.corrections / stats.total) * 0.1),
      sampleCount: stats.total,
      avgConfidence: stats.avgQuality / stats.total,
      improvementTrend: Math.random() * 0.1 - 0.05 // Mock trend
    }));

    // Calculate user contributions
    const userStats = new Map<string, { corrections: number; confirmations: number; quality: number }>();
    
    verifiedSamples.forEach(sample => {
      const userId = sample.userId;
      const stats = userStats.get(userId) || { corrections: 0, confirmations: 0, quality: 0 };
      stats.corrections += sample.userFeedback.detectionCorrections.length;
      stats.confirmations += sample.userFeedback.matchConfirmation ? 1 : 0;
      stats.quality += sample.qualityScore;
      userStats.set(userId, stats);
    });

    const userContributions = Array.from(userStats.entries())
      .map(([userId, stats]) => ({
        userId,
        correctionsProvided: stats.corrections,
        matchesConfirmed: stats.confirmations,
        qualityScore: stats.quality / verifiedSamples.filter(s => s.userId === userId).length,
        contributionRank: 0 // Will be calculated after sorting
      }))
      .sort((a, b) => (b.correctionsProvided + b.matchesConfirmed) - (a.correctionsProvided + a.matchesConfirmed))
      .map((user, index) => ({ ...user, contributionRank: index + 1 }))
      .slice(0, 10); // Top 10 contributors

    return {
      totalSamples: this.verifiedSamples.length,
      verifiedSamples: verifiedSamples.length,
      pendingSamples: pendingSamples.length,
      modelAccuracy: this.getCurrentAccuracy(),
      lastRetrainingDate: this.getLastRetrainingDate(),
      nextRetrainingDate: this.getNextRetrainingDate(),
      categoryPerformance,
      userContributions
    };
  }

  // Get current model accuracy
  private getCurrentAccuracy(): number {
    const activeModel = this.modelVersions.find(v => v.status === 'active');
    return activeModel ? activeModel.accuracy : 0.87;
  }

  // Get last retraining date
  private getLastRetrainingDate(): string {
    const activeModel = this.modelVersions.find(v => v.status === 'active');
    return activeModel ? activeModel.trainingDate : '2024-01-15';
  }

  // Get next retraining date
  private getNextRetrainingDate(): string {
    const scheduledTrigger = this.retrainingTriggers.find(t => t.triggerType === 'scheduled');
    if (scheduledTrigger) {
      const nextDate = new Date();
      nextDate.setDate(nextDate.getDate() + (7 - scheduledTrigger.currentValue));
      return nextDate.toISOString().split('T')[0];
    }
    return new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
  }

  // Get retraining triggers
  async getRetrainingTriggers(): Promise<RetrainingTrigger[]> {
    return [...this.retrainingTriggers];
  }

  // Get model versions
  async getModelVersions(): Promise<ModelVersion[]> {
    return [...this.modelVersions];
  }

  // Get learning progress
  async getLearningProgress(): Promise<LearningProgress> {
    return { ...this.learningProgress };
  }

  // Get configuration
  async getConfig(): Promise<AutoLearningConfig> {
    return { ...this.config };
  }

  // Update configuration
  async updateConfig(newConfig: Partial<AutoLearningConfig>): Promise<void> {
    this.config = { ...this.config, ...newConfig };
    localStorage.setItem('autoLearningConfig', JSON.stringify(this.config));
  }

  // Manual retraining trigger
  async triggerManualRetraining(): Promise<void> {
    const trigger: RetrainingTrigger = {
      id: `manual_${Date.now()}`,
      triggerType: 'manual',
      threshold: 0,
      currentValue: 1,
      status: 'triggered',
      timestamp: new Date().toISOString(),
      description: 'Manual retraining initiated by administrator'
    };
    
    this.retrainingTriggers.push(trigger);
    await this.triggerRetraining('manual');
  }
}

export const autoLearningService = new AutoLearningService();