export * from './item';
import { Item } from './item';

export interface Match {
  itemId: string;
  matchedItemId: string;
  similarityScore: number;
  matchType: 'visual' | 'metadata' | 'hybrid';
  confidence: number;
  explanation: string[];
  timestamp: string;
  autoDetected?: boolean;
}

export interface SimilaritySearchResult {
  item: Item;
  similarityScore: number;
  matchType: 'visual' | 'metadata' | 'hybrid';
  explanation: string[];
}

export interface UserFeedback {
  id: string;
  userId: string;
  itemId: string;
  feedbackType: 'classification_correct' | 'classification_wrong';
  originalPrediction: string;
  userCorrection?: string;
  confidenceRating: number;
  timestamp: string;
  notes?: string;
  matchId?: string; // Keep for backward compatibility if needed
  isCorrect?: boolean; // Keep for backward compatibility if needed
}

export interface UserStats {
  userId: string;
  trainingContributions: number;
  accuracyImprovement: number;
  feedbackCount: number;
  successfulMatches: number;
  level: number;
  points: number;
  badges: string[];
}

export interface Notification {
  id: string;
  userId: string;
  type: 'match_found' | 'item_claimed' | 'verification_required' | 'classification_feedback';
  title: string;
  message: string;
  itemId?: string; // Deprecated, use relatedItemId
  relatedItemId?: string; // Format: 'lost_1' or 'found_1'
  read: boolean;
  timestamp: string;
  data?: unknown;
  priority?: 'low' | 'medium' | 'high';
  metadata?: {
    matchScore?: number;
    confidence?: 'low' | 'medium' | 'high';
    explanation?: string[];
    details?: {
      visualSimilarity?: number;
      categoryMatch?: number;
      locationScore?: number;
      dateScore?: number;
      descriptionScore?: number;
    };
    matchedItem?: {
      id: string;
      title: string;
      imageUrl?: string;
      location?: string;
      dateReported?: string;
    };
  };
}

export interface ChatMessage {
  id: string;
  type: 'user' | 'bot';
  content: string;
  timestamp: string;
  suggestions?: string[];
}

export interface ChatbotResponse {
  response: string;
  suggestions: string[];
  extracted_info?: {
    category?: string;
    description?: string;
    location?: string;
  };
}



export interface TrainingData {
  id: string;
  imagePath: string;
  originalPrediction: string;
  verifiedLabel: string;
  confidenceScore: number;
  userFeedbackType: 'classification_correct' | 'classification_wrong';
  embeddingVector: number[];
  createdAt: string;
  verifiedAt: string;
  usedInTraining: boolean;
  userId: string;
}

export interface ModelVersion {
  id: string;
  versionNumber: string;
  trainingSamplesCount: number;
  validationAccuracy: number;
  trainingStartedAt: string;
  trainingCompletedAt?: string;
  isActive: boolean;
  performanceMetrics: {
    accuracy: number;
    precision: number;
    recall: number;
    f1Score: number;
  };
}