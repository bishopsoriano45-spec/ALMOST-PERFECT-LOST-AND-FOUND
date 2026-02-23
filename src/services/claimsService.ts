import { 
  Claim, 
  ClaimMatch, 
  ClaimDispute, 
  ClaimAnalytics, 
  AdminNote, 
  BulkAction, 
  ClaimFilter,
  AdminNotification,
  User,
  UserFlag
} from '@/types/claims';

class ClaimsService {
  private claims: Claim[] = [];
  private matches: ClaimMatch[] = [];
  private disputes: ClaimDispute[] = [];
  private adminNotes: AdminNote[] = [];
  private users: User[] = [];
  private notifications: AdminNotification[] = [];

  constructor() {
    this.initializeMockData();
  }

  // Initialize with comprehensive mock data
  private initializeMockData(): void {
    // Mock users
    for (let i = 0; i < 50; i++) {
      this.users.push({
        id: `user_${i}`,
        email: `user${i}@example.com`,
        name: `User ${i}`,
        phone: `+1-555-${String(i).padStart(4, '0')}`,
        isBlocked: Math.random() < 0.05, // 5% blocked users
        reputation: Math.floor(Math.random() * 100),
        claimsCount: Math.floor(Math.random() * 20),
        successfulMatches: Math.floor(Math.random() * 10),
        joinDate: new Date(Date.now() - Math.random() * 365 * 24 * 60 * 60 * 1000).toISOString(),
        lastActivity: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000).toISOString(),
        verificationLevel: (['unverified', 'email_verified', 'phone_verified', 'fully_verified'][Math.floor(Math.random() * 4)]) as User['verificationLevel'],
        flags: []
      });
    }

    // Mock claims
    const categories = ['Electronics', 'Bags & Accessories', 'Personal Items', 'Clothing', 'Sports & Recreation', 'Documents', 'Jewelry', 'Keys'];
    const locations = ['Library', 'Cafeteria', 'Parking Lot', 'Gym', 'Classroom 101', 'Student Center', 'Dormitory', 'Bus Stop'];
    const statuses: Claim['status'][] = ['pending', 'verified', 'matched', 'closed', 'disputed', 'rejected'];
    const priorities: Claim['priority'][] = ['low', 'medium', 'high', 'urgent'];

    for (let i = 0; i < 200; i++) {
      const user = this.users[Math.floor(Math.random() * this.users.length)];
      const category = categories[Math.floor(Math.random() * categories.length)];
      const location = locations[Math.floor(Math.random() * locations.length)];
      const claimType: Claim['claimType'] = Math.random() > 0.5 ? 'lost' : 'found';
      
      const claim: Claim = {
        id: `claim_${i}`,
        itemId: `item_${i}`,
        userId: user.id,
        userEmail: user.email,
        userName: user.name,
        userPhone: user.phone,
        claimType,
        status: statuses[Math.floor(Math.random() * statuses.length)],
        priority: priorities[Math.floor(Math.random() * priorities.length)],
        title: `${claimType === 'lost' ? 'Lost' : 'Found'} ${category.toLowerCase()}`,
        description: `A ${category.toLowerCase()} was ${claimType} at ${location}. Please contact if you have any information.`,
        category,
        location,
        dateReported: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000).toISOString(),
        dateIncident: new Date(Date.now() - Math.random() * 60 * 24 * 60 * 60 * 1000).toISOString(),
        images: [`/images/claim_${i}_1.jpg`, `/images/claim_${i}_2.jpg`],
        contactPreference: (['email', 'phone', 'both'][Math.floor(Math.random() * 3)]) as Claim['contactPreference'],
        aiConfidenceScore: 0.6 + Math.random() * 0.4,
        matchingSuggestions: [],
        adminNotes: [],
        tags: [`tag_${Math.floor(Math.random() * 10)}`],
        isUrgent: Math.random() < 0.1, // 10% urgent claims
        lastUpdated: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000).toISOString(),
        assignedTo: Math.random() < 0.7 ? `admin_${Math.floor(Math.random() * 5)}` : undefined,
        estimatedValue: Math.floor(Math.random() * 1000) + 50,
        reward: Math.random() < 0.3 ? Math.floor(Math.random() * 200) + 20 : undefined
      };

      this.claims.push(claim);
    }

    // Generate claim matches
    for (let i = 0; i < 50; i++) {
      const lostClaims = this.claims.filter(c => c.claimType === 'lost');
      const foundClaims = this.claims.filter(c => c.claimType === 'found');
      
      if (lostClaims.length > 0 && foundClaims.length > 0) {
        const lostClaim = lostClaims[Math.floor(Math.random() * lostClaims.length)];
        const foundClaim = foundClaims[Math.floor(Math.random() * foundClaims.length)];
        
        const match: ClaimMatch = {
          matchId: `match_${i}`,
          claimId: lostClaim.id,
          matchedClaimId: foundClaim.id,
          similarityScore: 0.7 + Math.random() * 0.3,
          aiConfidence: 0.6 + Math.random() * 0.4,
          matchType: (['exact', 'similar', 'possible'][Math.floor(Math.random() * 3)]) as ClaimMatch['matchType'],
          matchReason: 'Similar category, location, and description',
          status: (['suggested', 'reviewed', 'confirmed', 'rejected'][Math.floor(Math.random() * 4)]) as ClaimMatch['status'],
          reviewedBy: Math.random() < 0.8 ? `admin_${Math.floor(Math.random() * 5)}` : undefined,
          reviewDate: Math.random() < 0.8 ? new Date().toISOString() : undefined,
          contactInitiated: Math.random() < 0.6
        };

        this.matches.push(match);
        
        // Add match to claims
        if (!lostClaim.matchingSuggestions) lostClaim.matchingSuggestions = [];
        lostClaim.matchingSuggestions.push(match);
      }
    }

    // Generate disputes
    for (let i = 0; i < 10; i++) {
      const claim = this.claims[Math.floor(Math.random() * this.claims.length)];
      
      const dispute: ClaimDispute = {
        id: `dispute_${i}`,
        claimId: claim.id,
        disputeType: (['ownership', 'details', 'fraud', 'duplicate'][Math.floor(Math.random() * 4)]) as ClaimDispute['disputeType'],
        reportedBy: `user_${Math.floor(Math.random() * 50)}`,
        description: 'This claim appears to be fraudulent or contains incorrect information.',
        evidence: [`/evidence/dispute_${i}_1.jpg`],
        status: (['open', 'investigating', 'resolved', 'closed'][Math.floor(Math.random() * 4)]) as ClaimDispute['status'],
        assignedTo: `admin_${Math.floor(Math.random() * 5)}`,
        createdAt: new Date(Date.now() - Math.random() * 14 * 24 * 60 * 60 * 1000).toISOString(),
        resolvedAt: Math.random() < 0.5 ? new Date().toISOString() : undefined
      };

      this.disputes.push(dispute);
      claim.status = 'disputed';
    }

    // Generate admin notifications
    for (let i = 0; i < 20; i++) {
      const notification: AdminNotification = {
        id: `notification_${i}`,
        type: (['urgent_claim', 'potential_match', 'dispute', 'system_alert', 'user_report'][Math.floor(Math.random() * 5)]) as AdminNotification['type'],
        title: `Notification ${i}`,
        message: 'This is a sample admin notification message.',
        claimId: Math.random() < 0.7 ? `claim_${Math.floor(Math.random() * 200)}` : undefined,
        userId: Math.random() < 0.5 ? `user_${Math.floor(Math.random() * 50)}` : undefined,
        priority: (['low', 'medium', 'high', 'critical'][Math.floor(Math.random() * 4)]) as AdminNotification['priority'],
        isRead: Math.random() < 0.6,
        createdAt: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000).toISOString(),
        actionRequired: Math.random() < 0.4,
        actionUrl: Math.random() < 0.4 ? `/admin/claims/claim_${Math.floor(Math.random() * 200)}` : undefined
      };

      this.notifications.push(notification);
    }

    // Save to localStorage
    this.saveToStorage();
  }

  // Save data to localStorage
  private saveToStorage(): void {
    localStorage.setItem('adminClaims', JSON.stringify(this.claims));
    localStorage.setItem('adminMatches', JSON.stringify(this.matches));
    localStorage.setItem('adminDisputes', JSON.stringify(this.disputes));
    localStorage.setItem('adminUsers', JSON.stringify(this.users));
    localStorage.setItem('adminNotifications', JSON.stringify(this.notifications));
  }

  // Get all claims with filtering
  async getClaims(filter?: ClaimFilter): Promise<Claim[]> {
    let filteredClaims = [...this.claims];

    if (filter) {
      if (filter.status && filter.status.length > 0) {
        filteredClaims = filteredClaims.filter(claim => filter.status!.includes(claim.status));
      }

      if (filter.category && filter.category.length > 0) {
        filteredClaims = filteredClaims.filter(claim => filter.category!.includes(claim.category));
      }

      if (filter.location && filter.location.length > 0) {
        filteredClaims = filteredClaims.filter(claim => filter.location!.includes(claim.location));
      }

      if (filter.priority && filter.priority.length > 0) {
        filteredClaims = filteredClaims.filter(claim => filter.priority!.includes(claim.priority));
      }

      if (filter.dateRange) {
        const [startDate, endDate] = filter.dateRange;
        filteredClaims = filteredClaims.filter(claim => {
          const claimDate = new Date(claim.dateReported).getTime();
          return claimDate >= new Date(startDate).getTime() && claimDate <= new Date(endDate).getTime();
        });
      }

      if (filter.assignedTo) {
        filteredClaims = filteredClaims.filter(claim => claim.assignedTo === filter.assignedTo);
      }

      if (filter.hasMatches !== undefined) {
        filteredClaims = filteredClaims.filter(claim => 
          filter.hasMatches ? (claim.matchingSuggestions && claim.matchingSuggestions.length > 0) : 
          (!claim.matchingSuggestions || claim.matchingSuggestions.length === 0)
        );
      }

      if (filter.isUrgent !== undefined) {
        filteredClaims = filteredClaims.filter(claim => claim.isUrgent === filter.isUrgent);
      }

      if (filter.searchTerm) {
        const term = filter.searchTerm.toLowerCase();
        filteredClaims = filteredClaims.filter(claim => 
          claim.title.toLowerCase().includes(term) ||
          claim.description.toLowerCase().includes(term) ||
          claim.userName.toLowerCase().includes(term) ||
          claim.userEmail.toLowerCase().includes(term)
        );
      }
    }

    return filteredClaims.sort((a, b) => new Date(b.dateReported).getTime() - new Date(a.dateReported).getTime());
  }

  // Get claim by ID
  async getClaimById(claimId: string): Promise<Claim | null> {
    return this.claims.find(claim => claim.id === claimId) || null;
  }

  // Update claim status
  async updateClaimStatus(claimId: string, status: Claim['status'], adminId: string, reason?: string): Promise<void> {
    const claim = this.claims.find(c => c.id === claimId);
    if (claim) {
      const oldStatus = claim.status;
      claim.status = status;
      claim.lastUpdated = new Date().toISOString();

      // Add admin note
      if (reason) {
        await this.addAdminNote(claimId, adminId, `Status changed from ${oldStatus} to ${status}: ${reason}`, 'general');
      }

      this.saveToStorage();
    }
  }

  // Perform bulk actions
  async performBulkAction(action: BulkAction, adminId: string): Promise<void> {
    for (const claimId of action.claimIds) {
      const claim = this.claims.find(c => c.id === claimId);
      if (!claim) continue;

      switch (action.action) {
        case 'approve':
          claim.status = 'verified';
          break;
        case 'reject':
          claim.status = 'rejected';
          break;
        case 'verify':
          claim.status = 'verified';
          break;
        case 'close':
          claim.status = 'closed';
          break;
        case 'assign':
          claim.assignedTo = action.assignTo;
          break;
        case 'priority':
          claim.priority = action.newPriority!;
          break;
      }

      claim.lastUpdated = new Date().toISOString();

      // Add admin note
      await this.addAdminNote(
        claimId, 
        adminId, 
        `Bulk action: ${action.action}${action.reason ? ` - ${action.reason}` : ''}`, 
        'general'
      );
    }

    this.saveToStorage();
  }

  // Add admin note
  async addAdminNote(claimId: string, adminId: string, note: string, type: AdminNote['type']): Promise<void> {
    const adminNote: AdminNote = {
      id: `note_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      adminId,
      adminName: `Admin ${adminId}`,
      note,
      timestamp: new Date().toISOString(),
      type
    };

    this.adminNotes.push(adminNote);

    const claim = this.claims.find(c => c.id === claimId);
    if (claim) {
      if (!claim.adminNotes) claim.adminNotes = [];
      claim.adminNotes.push(adminNote);
    }

    this.saveToStorage();
  }

  // Get claim analytics
  async getClaimAnalytics(): Promise<ClaimAnalytics> {
    const totalClaims = this.claims.length;
    const pendingClaims = this.claims.filter(c => c.status === 'pending').length;
    const verifiedClaims = this.claims.filter(c => c.status === 'verified').length;
    const matchedClaims = this.claims.filter(c => c.status === 'matched').length;
    const closedClaims = this.claims.filter(c => c.status === 'closed').length;
    const disputedClaims = this.claims.filter(c => c.status === 'disputed').length;

    const successRate = totalClaims > 0 ? (matchedClaims + closedClaims) / totalClaims : 0;

    // Calculate average processing time
    const processedClaims = this.claims.filter(c => ['matched', 'closed'].includes(c.status));
    const avgProcessingTime = processedClaims.length > 0 
      ? processedClaims.reduce((sum, claim) => {
          const reported = new Date(claim.dateReported).getTime();
          const updated = new Date(claim.lastUpdated).getTime();
          return sum + (updated - reported);
        }, 0) / processedClaims.length / (24 * 60 * 60 * 1000) // Convert to days
      : 0;

    // Category statistics
    const categoryMap = new Map<string, { count: number; matched: number; totalTime: number }>();
    this.claims.forEach(claim => {
      const stats = categoryMap.get(claim.category) || { count: 0, matched: 0, totalTime: 0 };
      stats.count++;
      if (['matched', 'closed'].includes(claim.status)) {
        stats.matched++;
        const processingTime = new Date(claim.lastUpdated).getTime() - new Date(claim.dateReported).getTime();
        stats.totalTime += processingTime / (24 * 60 * 60 * 1000);
      }
      categoryMap.set(claim.category, stats);
    });

    const claimsByCategory = Array.from(categoryMap.entries()).map(([category, stats]) => ({
      category,
      count: stats.count,
      successRate: stats.count > 0 ? stats.matched / stats.count : 0,
      averageTime: stats.matched > 0 ? stats.totalTime / stats.matched : 0
    }));

    // Location statistics
    const locationMap = new Map<string, { count: number; matched: number }>();
    this.claims.forEach(claim => {
      const stats = locationMap.get(claim.location) || { count: 0, matched: 0 };
      stats.count++;
      if (['matched', 'closed'].includes(claim.status)) {
        stats.matched++;
      }
      locationMap.set(claim.location, stats);
    });

    const claimsByLocation = Array.from(locationMap.entries()).map(([location, stats]) => ({
      location,
      count: stats.count,
      successRate: stats.count > 0 ? stats.matched / stats.count : 0
    }));

    // Monthly trends (last 6 months)
    const monthlyTrends = [];
    for (let i = 5; i >= 0; i--) {
      const date = new Date();
      date.setMonth(date.getMonth() - i);
      const monthKey = date.toISOString().substr(0, 7);
      
      const monthClaims = this.claims.filter(claim => 
        claim.dateReported.startsWith(monthKey)
      );
      const monthMatches = monthClaims.filter(claim => 
        ['matched', 'closed'].includes(claim.status)
      );

      monthlyTrends.push({
        month: date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' }),
        claims: monthClaims.length,
        matches: monthMatches.length,
        successRate: monthClaims.length > 0 ? monthMatches.length / monthClaims.length : 0
      });
    }

    // Top users
    const userMap = new Map<string, { claims: number; matches: number }>();
    this.claims.forEach(claim => {
      const stats = userMap.get(claim.userId) || { claims: 0, matches: 0 };
      stats.claims++;
      if (['matched', 'closed'].includes(claim.status)) {
        stats.matches++;
      }
      userMap.set(claim.userId, stats);
    });

    const topUsers = Array.from(userMap.entries())
      .map(([userId, stats]) => {
        const user = this.users.find(u => u.id === userId);
        return {
          userId,
          userName: user?.name || 'Unknown User',
          claimsCount: stats.claims,
          successfulMatches: stats.matches,
          reputation: user?.reputation || 0
        };
      })
      .sort((a, b) => b.claimsCount - a.claimsCount)
      .slice(0, 10);

    return {
      totalClaims,
      pendingClaims,
      verifiedClaims,
      matchedClaims,
      closedClaims,
      disputedClaims,
      successRate,
      averageProcessingTime: avgProcessingTime,
      claimsByCategory,
      claimsByLocation,
      monthlyTrends,
      topUsers
    };
  }

  // Get admin notifications
  async getNotifications(adminId: string): Promise<AdminNotification[]> {
    return this.notifications
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, 50);
  }

  // Mark notification as read
  async markNotificationAsRead(notificationId: string): Promise<void> {
    const notification = this.notifications.find(n => n.id === notificationId);
    if (notification) {
      notification.isRead = true;
      this.saveToStorage();
    }
  }

  // Get users
  async getUsers(filter?: { isBlocked?: boolean; searchTerm?: string }): Promise<User[]> {
    let filteredUsers = [...this.users];

    if (filter) {
      if (filter.isBlocked !== undefined) {
        filteredUsers = filteredUsers.filter(user => user.isBlocked === filter.isBlocked);
      }

      if (filter.searchTerm) {
        const term = filter.searchTerm.toLowerCase();
        filteredUsers = filteredUsers.filter(user => 
          user.name.toLowerCase().includes(term) ||
          user.email.toLowerCase().includes(term)
        );
      }
    }

    return filteredUsers.sort((a, b) => new Date(b.lastActivity).getTime() - new Date(a.lastActivity).getTime());
  }

  // Block/unblock user
  async toggleUserBlock(userId: string, adminId: string, reason?: string): Promise<void> {
    const user = this.users.find(u => u.id === userId);
    if (user) {
      user.isBlocked = !user.isBlocked;
      
      // Add flag if blocking
      if (user.isBlocked && reason) {
        const flag: UserFlag = {
          id: `flag_${Date.now()}`,
          type: 'suspicious',
          reason,
          flaggedBy: adminId,
          flaggedAt: new Date().toISOString(),
          status: 'active'
        };
        user.flags.push(flag);
      }

      this.saveToStorage();
    }
  }

  // Export claims data
  async exportClaims(exportConfig: { format: string; filters: ClaimFilter }): Promise<string> {
    const claims = await this.getClaims(exportConfig.filters);
    
    if (exportConfig.format === 'csv') {
      const headers = ['ID', 'Title', 'Status', 'Category', 'Location', 'User', 'Date Reported', 'Priority'];
      const rows = claims.map(claim => [
        claim.id,
        claim.title,
        claim.status,
        claim.category,
        claim.location,
        claim.userName,
        claim.dateReported,
        claim.priority
      ]);
      
      return [headers, ...rows].map(row => row.join(',')).join('\n');
    }

    return JSON.stringify(claims, null, 2);
  }

  // Get claim matches
  async getClaimMatches(claimId: string): Promise<ClaimMatch[]> {
    return this.matches.filter(match => match.claimId === claimId);
  }

  // Update match status
  async updateMatchStatus(matchId: string, status: ClaimMatch['status'], adminId: string): Promise<void> {
    const match = this.matches.find(m => m.matchId === matchId);
    if (match) {
      match.status = status;
      match.reviewedBy = adminId;
      match.reviewDate = new Date().toISOString();
      this.saveToStorage();
    }
  }

  // Get disputes
  async getDisputes(): Promise<ClaimDispute[]> {
    return this.disputes.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  // Update dispute status
  async updateDisputeStatus(disputeId: string, status: ClaimDispute['status'], resolution?: string): Promise<void> {
    const dispute = this.disputes.find(d => d.id === disputeId);
    if (dispute) {
      dispute.status = status;
      if (resolution) {
        dispute.resolution = resolution;
      }
      if (status === 'resolved' || status === 'closed') {
        dispute.resolvedAt = new Date().toISOString();
      }
      this.saveToStorage();
    }
  }
}

export const claimsService = new ClaimsService();