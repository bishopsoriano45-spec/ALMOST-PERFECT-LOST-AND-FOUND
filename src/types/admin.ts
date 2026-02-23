export interface ClaimRequest {
  id: string;
  itemId: string;
  claimantId: string;
  claimantName: string;
  claimantEmail: string;
  claimantPhone?: string;
  status: 'pending' | 'approved' | 'rejected' | 'under_review';
  submittedAt: string;
  reviewedAt?: string;
  reviewedBy?: string;
  verificationMethod: 'description' | 'photo' | 'receipt' | 'witness' | 'other';
  verificationDetails: string;
  proofImages?: string[];
  adminNotes?: string;
  priority: 'low' | 'medium' | 'high';
  confidenceScore?: number;
}

export interface AdminUser {
  id: string;
  email: string;
  name: string;
  role: 'super_admin' | 'admin' | 'moderator';
  permissions: AdminPermission[];
  createdAt: string;
  lastLogin?: string;
  isActive: boolean;
}

export interface AdminPermission {
  resource: 'items' | 'users' | 'claims' | 'ai_system' | 'notifications' | 'settings';
  actions: ('read' | 'write' | 'delete' | 'approve')[];
}

export interface AdminDashboardStats {
  totalItems: number;
  activeItems: number;
  matchedItems: number;
  pendingClaims: number;
  totalUsers: number;
  activeUsers: number;
  aiAccuracy: number;
  notificationsSent: number;
  successfulMatches: number;
  recentActivity: AdminActivity[];
}

export interface AdminActivity {
  id: string;
  type: 'item_created' | 'claim_submitted' | 'claim_approved' | 'claim_rejected' | 'user_registered' | 'ai_retrained';
  description: string;
  userId?: string;
  itemId?: string;
  timestamp: string;
  severity: 'info' | 'warning' | 'error' | 'success';
}

export interface ItemManagementFilter {
  status?: string[];
  category?: string[];
  type?: 'lost' | 'found';
  dateRange?: {
    start: string;
    end: string;
  };
  location?: string;
  verificationStatus?: 'verified' | 'unverified' | 'flagged';
  aiConfidence?: {
    min: number;
    max: number;
  };
}

export interface UserManagementData {
  id: string;
  name: string;
  email: string;
  phone?: string;
  joinedAt: string;
  lastActive: string;
  itemsReported: number;
  successfulMatches: number;
  trustScore: number;
  verificationStatus: 'verified' | 'unverified' | 'flagged';
  flags: UserFlag[];
}

export interface UserFlag {
  id: string;
  type: 'suspicious_activity' | 'multiple_accounts' | 'fake_items' | 'spam' | 'harassment';
  description: string;
  severity: 'low' | 'medium' | 'high';
  createdAt: string;
  resolvedAt?: string;
}

export interface AISystemMetrics {
  currentModelVersion: string;
  accuracy: number;
  precision: number;
  recall: number;
  f1Score: number;
  totalPredictions: number;
  correctPredictions: number;
  userFeedbackCount: number;
  lastTrainingDate: string;
  nextScheduledTraining: string;
  trainingDataSize: number;
  categoryAccuracy: Record<string, number>;
}

export interface NotificationMetrics {
  totalSent: number;
  deliveryRate: number;
  openRate: number;
  clickThroughRate: number;
  unsubscribeRate: number;
  channelPerformance: Record<string, {
    sent: number;
    delivered: number;
    opened: number;
    clicked: number;
  }>;
  recentNotifications: {
    id: string;
    type: string;
    recipient: string;
    status: 'sent' | 'delivered' | 'opened' | 'failed';
    sentAt: string;
  }[];
}