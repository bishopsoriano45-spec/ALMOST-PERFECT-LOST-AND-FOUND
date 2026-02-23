// Claims Management Type Definitions

export interface Claim {
  id: string;
  itemId: string;
  userId: string;
  userEmail: string;
  userName: string;
  userPhone?: string;
  claimType: 'lost' | 'found';
  status: 'pending' | 'verified' | 'matched' | 'closed' | 'disputed' | 'rejected';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  title: string;
  description: string;
  category: string;
  location: string;
  dateReported: string;
  dateIncident: string;
  images: string[];
  contactPreference: 'email' | 'phone' | 'both';
  verificationDocuments?: string[];
  aiConfidenceScore?: number;
  matchingSuggestions?: ClaimMatch[];
  adminNotes?: AdminNote[];
  tags?: string[];
  isUrgent: boolean;
  lastUpdated: string;
  assignedTo?: string;
  estimatedValue?: number;
  reward?: number;
}

export interface ClaimMatch {
  matchId: string;
  claimId: string;
  matchedClaimId: string;
  similarityScore: number;
  aiConfidence: number;
  matchType: 'exact' | 'similar' | 'possible';
  matchReason: string;
  status: 'suggested' | 'reviewed' | 'confirmed' | 'rejected';
  reviewedBy?: string;
  reviewDate?: string;
  contactInitiated: boolean;
}

export interface AdminNote {
  id: string;
  adminId: string;
  adminName: string;
  note: string;
  timestamp: string;
  type: 'general' | 'verification' | 'contact' | 'dispute' | 'resolution';
}

export interface ClaimDispute {
  id: string;
  claimId: string;
  disputeType: 'ownership' | 'details' | 'fraud' | 'duplicate';
  reportedBy: string;
  description: string;
  evidence?: string[];
  status: 'open' | 'investigating' | 'resolved' | 'closed';
  assignedTo?: string;
  resolution?: string;
  createdAt: string;
  resolvedAt?: string;
}

export interface ClaimAnalytics {
  totalClaims: number;
  pendingClaims: number;
  verifiedClaims: number;
  matchedClaims: number;
  closedClaims: number;
  disputedClaims: number;
  successRate: number;
  averageProcessingTime: number;
  claimsByCategory: CategoryStats[];
  claimsByLocation: LocationStats[];
  monthlyTrends: MonthlyStats[];
  topUsers: UserStats[];
}

export interface CategoryStats {
  category: string;
  count: number;
  successRate: number;
  averageTime: number;
}

export interface LocationStats {
  location: string;
  count: number;
  successRate: number;
}

export interface MonthlyStats {
  month: string;
  claims: number;
  matches: number;
  successRate: number;
}

export interface UserStats {
  userId: string;
  userName: string;
  claimsCount: number;
  successfulMatches: number;
  reputation: number;
}

export interface AdminUser {
  id: string;
  email: string;
  name: string;
  role: 'super_admin' | 'admin' | 'moderator' | 'support';
  permissions: AdminPermission[];
  isActive: boolean;
  lastLogin: string;
  createdAt: string;
}

export interface AdminPermission {
  resource: string;
  actions: ('create' | 'read' | 'update' | 'delete' | 'approve')[];
}

export interface User {
  id: string;
  email: string;
  name: string;
  phone?: string;
  isBlocked: boolean;
  reputation: number;
  claimsCount: number;
  successfulMatches: number;
  joinDate: string;
  lastActivity: string;
  verificationLevel: 'unverified' | 'email_verified' | 'phone_verified' | 'fully_verified';
  flags: UserFlag[];
}

export interface UserFlag {
  id: string;
  type: 'spam' | 'fraud' | 'inappropriate' | 'suspicious';
  reason: string;
  flaggedBy: string;
  flaggedAt: string;
  status: 'active' | 'resolved' | 'dismissed';
}

export interface BulkAction {
  action: 'approve' | 'reject' | 'verify' | 'close' | 'assign' | 'priority';
  claimIds: string[];
  reason?: string;
  assignTo?: string;
  newPriority?: 'low' | 'medium' | 'high' | 'urgent';
}

export interface ClaimFilter {
  status?: string[];
  category?: string[];
  location?: string[];
  priority?: string[];
  dateRange?: [string, string];
  assignedTo?: string;
  hasMatches?: boolean;
  isUrgent?: boolean;
  searchTerm?: string;
}

export interface ClaimExport {
  format: 'csv' | 'excel' | 'pdf';
  fields: string[];
  filters: ClaimFilter;
  includeImages: boolean;
  includeNotes: boolean;
}

export interface AdminNotification {
  id: string;
  type: 'urgent_claim' | 'potential_match' | 'dispute' | 'system_alert' | 'user_report';
  title: string;
  message: string;
  claimId?: string;
  userId?: string;
  priority: 'low' | 'medium' | 'high' | 'critical';
  isRead: boolean;
  createdAt: string;
  actionRequired: boolean;
  actionUrl?: string;
}