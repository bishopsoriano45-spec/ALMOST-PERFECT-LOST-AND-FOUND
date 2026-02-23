export interface Item {
  id: string;
  type: 'lost' | 'found';
  title: string;
  description: string;
  category: string;
  imageUrl?: string;
  location: {
    name: string;
    coordinates?: { lat: number; lng: number };
  };
  dateReported: string;
  contactInfo: {
    name: string;
    email: string;
    phone?: string;
  };
  status: 'active' | 'matched' | 'claimed';
  tags: string[];
  aiClassification?: AIClassification;
  verificationRequired: boolean;
  qrCode?: string;
  embedding?: number[];
  confidenceScore?: number;
  userFeedback?: UserFeedback[];
}

export interface AIClassification {
  category: string;
  subcategory?: string;
  confidence: number;
  features: string[];
  alternatives?: Array<{category: string; confidence: number}>;
  processingTime?: number;
}

export interface Match {
  itemId: string;
  matchedItemId: string;
  similarityScore: number;
  matchType: 'visual' | 'metadata' | 'hybrid';
  confidence: number;
  explanation: string[];
  timestamp: string;
  userConfirmed?: boolean;
  autoDetected: boolean;
}

export interface UserFeedback {
  id: string;
  userId: string;
  itemId: string;
  feedbackType: 'classification_correct' | 'classification_wrong' | 'match_confirmed' | 'match_rejected';
  originalPrediction?: string;
  userCorrection?: string;
  confidenceRating: number; // 1-5
  timestamp: string;
  notes?: string;
}

export interface Notification {
  id: string;
  userId: string;
  type: 'potential_match' | 'exact_match' | 'item_claimed' | 'classification_feedback' | 'training_complete';
  title: string;
  message: string;
  itemId?: string;
  matchId?: string;
  data?: any;
  read: boolean;
  timestamp: string;
  priority: 'high' | 'medium' | 'low';
  channels: Array<'in_app' | 'email' | 'push' | 'sms'>;
}

export interface NotificationPreferences {
  userId: string;
  emailEnabled: boolean;
  pushEnabled: boolean;
  smsEnabled: boolean;
  inAppEnabled: boolean;
  similarityThreshold: number; // 0.0 - 1.0
  notificationFrequency: 'immediate' | 'hourly' | 'daily';
  quietHours?: {
    start: string; // HH:MM
    end: string; // HH:MM
  };
  categories: string[]; // Categories to receive notifications for
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
}

export interface TrainingData {
  id: string;
  imagePath: string;
  originalPrediction: string;
  verifiedLabel: string;
  confidenceScore: number;
  userFeedbackType: 'confirmed' | 'corrected' | 'rejected';
  embeddingVector: number[];
  createdAt: string;
  verifiedAt?: string;
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

export interface SimilaritySearchResult {
  item: Item;
  similarityScore: number;
  explanation: string[];
  matchType: 'visual' | 'metadata' | 'hybrid';
}