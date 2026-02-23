// Auto-Learning System Type Definitions

export interface VerifiedSample {
  id: string;
  imageUrl: string;
  originalDetection: DetectedObject[];
  correctedDetection: DetectedObject[];
  userFeedback: UserFeedback;
  verificationStatus: 'pending' | 'verified' | 'rejected';
  qualityScore: number;
  timestamp: string;
  userId: string;
  category: string;
}

export interface UserFeedback {
  detectionCorrections: DetectionCorrection[];
  matchConfirmation?: MatchConfirmation;
  qualityRating: number; // 1-5 stars
  comments?: string;
  timestamp: string;
}

export interface DetectionCorrection {
  originalClass: string;
  correctedClass: string;
  confidence: number;
  bbox: BoundingBox;
  correctionType: 'class_change' | 'bbox_adjustment' | 'false_positive' | 'missed_detection';
}

export interface MatchConfirmation {
  matchedItemId: string;
  confirmationType: 'correct_match' | 'incorrect_match' | 'partial_match';
  confidence: number;
  notes?: string;
}

export interface BoundingBox {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface DetectedObject {
  class: string;
  confidence: number;
  bbox: BoundingBox;
  embedding?: number[];
}

export interface LearningMetrics {
  totalSamples: number;
  verifiedSamples: number;
  pendingSamples: number;
  modelAccuracy: number;
  lastRetrainingDate: string;
  nextRetrainingDate: string;
  categoryPerformance: CategoryPerformance[];
  userContributions: UserContribution[];
}

export interface CategoryPerformance {
  category: string;
  accuracy: number;
  sampleCount: number;
  avgConfidence: number;
  improvementTrend: number;
}

export interface UserContribution {
  userId: string;
  correctionsProvided: number;
  matchesConfirmed: number;
  qualityScore: number;
  contributionRank: number;
}

export interface RetrainingTrigger {
  id: string;
  triggerType: 'threshold' | 'scheduled' | 'performance_drop' | 'manual';
  threshold: number;
  currentValue: number;
  status: 'pending' | 'triggered' | 'completed' | 'failed';
  timestamp: string;
  description: string;
}

export interface ModelVersion {
  version: string;
  accuracy: number;
  trainingDate: string;
  sampleCount: number;
  improvements: string[];
  status: 'active' | 'testing' | 'archived';
}

export interface SimilarityMatch {
  itemId: string;
  similarity: number;
  matchType: 'class_match' | 'visual_match' | 'metadata_match' | 'composite_match';
  confidence: number;
  explanation: string;
}

export interface HierarchicalSearchResult {
  classMatches: SimilarityMatch[];
  visualMatches: SimilarityMatch[];
  metadataMatches: SimilarityMatch[];
  compositeScore: number;
  searchTime: number;
}

export interface DatasetStats {
  totalImages: number;
  verifiedImages: number;
  categoriesCount: number;
  avgQualityScore: number;
  recentAdditions: number;
  duplicatesRemoved: number;
  storageUsed: string;
}

export interface LearningProgress {
  currentPhase: 'data_collection' | 'validation' | 'training' | 'evaluation' | 'deployment';
  progress: number; // 0-100
  estimatedCompletion: string;
  currentTask: string;
  logs: string[];
}

export interface AutoLearningConfig {
  retrainingThreshold: number;
  qualityThreshold: number;
  maxSamplesPerCategory: number;
  scheduledRetrainingInterval: string;
  confidenceThreshold: number;
  enableAutoRetraining: boolean;
  enableQualityFiltering: boolean;
}