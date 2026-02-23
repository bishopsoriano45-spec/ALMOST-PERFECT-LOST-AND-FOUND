import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  BarChart3, 
  TrendingUp, 
  TrendingDown, 
  Users, 
  Clock, 
  Target, 
  Award,
  MapPin,
  Calendar,
  RefreshCw,
  Download
} from 'lucide-react';
import { ClaimAnalytics } from '@/types/claims';
import { claimsService } from '@/services/claimsService';
import { toast } from 'sonner';

export const ClaimsAnalyticsComponent: React.FC = () => {
  const [analytics, setAnalytics] = useState<ClaimAnalytics | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);

  // Load analytics data
  const loadAnalytics = async () => {
    try {
      setLoading(true);
      const data = await claimsService.getClaimAnalytics();
      setAnalytics(data);
    } catch (error) {
      toast.error('Failed to load analytics data');
    } finally {
      setLoading(false);
    }
  };

  // Refresh analytics
  const refreshAnalytics = async () => {
    setRefreshing(true);
    await loadAnalytics();
    setRefreshing(false);
    toast.success('Analytics refreshed');
  };

  // Export analytics
  const exportAnalytics = () => {
    if (!analytics) return;
    
    const data = JSON.stringify(analytics, null, 2);
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `claims_analytics_${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success('Analytics exported');
  };

  useEffect(() => {
    loadAnalytics();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!analytics) {
    return (
      <div className="text-center py-8">
        <BarChart3 className="h-12 w-12 text-gray-400 mx-auto mb-4" />
        <p className="text-gray-600 dark:text-gray-400">No analytics data available</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold">Claims Analytics</h2>
          <p className="text-gray-600 dark:text-gray-400">
            Comprehensive insights and performance metrics
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={refreshAnalytics} disabled={refreshing}>
            <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <Button variant="outline" onClick={exportAnalytics}>
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Claims</p>
                <p className="text-2xl font-bold text-blue-600">
                  {analytics.totalClaims.toLocaleString()}
                </p>
              </div>
              <BarChart3 className="h-8 w-8 text-blue-600" />
            </div>
            <div className="mt-2 text-xs text-gray-500">
              All time claims submitted
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Success Rate</p>
                <p className="text-2xl font-bold text-green-600">
                  {(analytics.successRate * 100).toFixed(1)}%
                </p>
              </div>
              <TrendingUp className="h-8 w-8 text-green-600" />
            </div>
            <div className="mt-2">
              <Progress value={analytics.successRate * 100} className="h-2" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Avg Processing Time</p>
                <p className="text-2xl font-bold text-purple-600">
                  {analytics.averageProcessingTime.toFixed(1)}d
                </p>
              </div>
              <Clock className="h-8 w-8 text-purple-600" />
            </div>
            <div className="mt-2 text-xs text-gray-500">
              Days to resolution
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Active Users</p>
                <p className="text-2xl font-bold text-orange-600">
                  {analytics.topUsers.length}
                </p>
              </div>
              <Users className="h-8 w-8 text-orange-600" />
            </div>
            <div className="mt-2 text-xs text-gray-500">
              Contributing users
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Status Breakdown */}
      <Card>
        <CardHeader>
          <CardTitle>Claims Status Distribution</CardTitle>
          <CardDescription>
            Current status breakdown of all claims
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-yellow-600 mb-1">
                {analytics.pendingClaims}
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400 mb-2">Pending</div>
              <Progress 
                value={(analytics.pendingClaims / analytics.totalClaims) * 100} 
                className="h-2" 
              />
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600 mb-1">
                {analytics.verifiedClaims}
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400 mb-2">Verified</div>
              <Progress 
                value={(analytics.verifiedClaims / analytics.totalClaims) * 100} 
                className="h-2" 
              />
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600 mb-1">
                {analytics.matchedClaims}
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400 mb-2">Matched</div>
              <Progress 
                value={(analytics.matchedClaims / analytics.totalClaims) * 100} 
                className="h-2" 
              />
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-gray-600 mb-1">
                {analytics.closedClaims}
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400 mb-2">Closed</div>
              <Progress 
                value={(analytics.closedClaims / analytics.totalClaims) * 100} 
                className="h-2" 
              />
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-red-600 mb-1">
                {analytics.disputedClaims}
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400 mb-2">Disputed</div>
              <Progress 
                value={(analytics.disputedClaims / analytics.totalClaims) * 100} 
                className="h-2" 
              />
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-600 mb-1">
                {analytics.totalClaims - analytics.pendingClaims - analytics.verifiedClaims - analytics.matchedClaims - analytics.closedClaims - analytics.disputedClaims}
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400 mb-2">Other</div>
              <Progress 
                value={((analytics.totalClaims - analytics.pendingClaims - analytics.verifiedClaims - analytics.matchedClaims - analytics.closedClaims - analytics.disputedClaims) / analytics.totalClaims) * 100} 
                className="h-2" 
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Analytics Tabs */}
      <Tabs defaultValue="categories" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="categories">Categories</TabsTrigger>
          <TabsTrigger value="locations">Locations</TabsTrigger>
          <TabsTrigger value="trends">Trends</TabsTrigger>
          <TabsTrigger value="users">Top Users</TabsTrigger>
        </TabsList>

        {/* Categories Tab */}
        <TabsContent value="categories" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Target className="h-5 w-5" />
                Performance by Category
              </CardTitle>
              <CardDescription>
                Success rates and processing times by item category
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {analytics.claimsByCategory
                  .sort((a, b) => b.count - a.count)
                  .map((category) => (
                    <div key={category.category} className="p-4 border rounded-lg">
                      <div className="flex items-center justify-between mb-2">
                        <h3 className="font-medium">{category.category}</h3>
                        <div className="flex items-center gap-2">
                          <Badge variant="outline">
                            {category.count} claims
                          </Badge>
                          <Badge className={category.successRate > 0.7 ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}>
                            {(category.successRate * 100).toFixed(1)}% success
                          </Badge>
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                          <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">Claims Count</div>
                          <Progress value={(category.count / Math.max(...analytics.claimsByCategory.map(c => c.count))) * 100} className="h-2" />
                          <div className="text-xs text-gray-500 mt-1">{category.count} total</div>
                        </div>
                        
                        <div>
                          <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">Success Rate</div>
                          <Progress value={category.successRate * 100} className="h-2" />
                          <div className="text-xs text-gray-500 mt-1">{(category.successRate * 100).toFixed(1)}%</div>
                        </div>
                        
                        <div>
                          <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">Avg Processing Time</div>
                          <Progress value={(category.averageTime / 30) * 100} className="h-2" />
                          <div className="text-xs text-gray-500 mt-1">{category.averageTime.toFixed(1)} days</div>
                        </div>
                      </div>
                    </div>
                  ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Locations Tab */}
        <TabsContent value="locations" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MapPin className="h-5 w-5" />
                Performance by Location
              </CardTitle>
              <CardDescription>
                Claims distribution and success rates by location
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {analytics.claimsByLocation
                  .sort((a, b) => b.count - a.count)
                  .map((location) => (
                    <div key={location.location} className="p-4 border rounded-lg">
                      <div className="flex items-center justify-between mb-3">
                        <h3 className="font-medium">{location.location}</h3>
                        <Badge variant="outline">
                          {location.count} claims
                        </Badge>
                      </div>
                      
                      <div className="space-y-2">
                        <div className="flex items-center justify-between text-sm">
                          <span>Claims Volume</span>
                          <span>{location.count}</span>
                        </div>
                        <Progress 
                          value={(location.count / Math.max(...analytics.claimsByLocation.map(l => l.count))) * 100} 
                          className="h-2" 
                        />
                        
                        <div className="flex items-center justify-between text-sm">
                          <span>Success Rate</span>
                          <span>{(location.successRate * 100).toFixed(1)}%</span>
                        </div>
                        <Progress value={location.successRate * 100} className="h-2" />
                      </div>
                    </div>
                  ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Trends Tab */}
        <TabsContent value="trends" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                Monthly Trends
              </CardTitle>
              <CardDescription>
                Claims volume and success rates over the last 6 months
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {analytics.monthlyTrends.map((month) => (
                  <div key={month.month} className="p-4 border rounded-lg">
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="font-medium">{month.month}</h3>
                      <div className="flex items-center gap-2">
                        <Badge variant="outline">
                          {month.claims} claims
                        </Badge>
                        <Badge variant="outline">
                          {month.matches} matches
                        </Badge>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div>
                        <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">Claims Submitted</div>
                        <div className="text-2xl font-bold text-blue-600">{month.claims}</div>
                      </div>
                      
                      <div>
                        <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">Successful Matches</div>
                        <div className="text-2xl font-bold text-green-600">{month.matches}</div>
                      </div>
                      
                      <div>
                        <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">Success Rate</div>
                        <div className="text-2xl font-bold text-purple-600">
                          {(month.successRate * 100).toFixed(1)}%
                        </div>
                        <Progress value={month.successRate * 100} className="h-2 mt-1" />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Top Users Tab */}
        <TabsContent value="users" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Award className="h-5 w-5" />
                Top Contributing Users
              </CardTitle>
              <CardDescription>
                Most active users and their success rates
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {analytics.topUsers.map((user, index) => (
                  <div key={user.userId} className="p-4 border rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center text-sm font-medium">
                          #{index + 1}
                        </div>
                        <div>
                          <h3 className="font-medium">{user.userName}</h3>
                          <p className="text-sm text-gray-600 dark:text-gray-400">
                            User ID: {user.userId}
                          </p>
                        </div>
                      </div>
                      <Badge variant="outline">
                        {user.reputation} reputation
                      </Badge>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="text-center">
                        <div className="text-2xl font-bold text-blue-600">
                          {user.claimsCount}
                        </div>
                        <div className="text-sm text-gray-600 dark:text-gray-400">
                          Total Claims
                        </div>
                      </div>
                      
                      <div className="text-center">
                        <div className="text-2xl font-bold text-green-600">
                          {user.successfulMatches}
                        </div>
                        <div className="text-sm text-gray-600 dark:text-gray-400">
                          Successful Matches
                        </div>
                      </div>
                      
                      <div className="text-center">
                        <div className="text-2xl font-bold text-purple-600">
                          {user.claimsCount > 0 ? ((user.successfulMatches / user.claimsCount) * 100).toFixed(1) : 0}%
                        </div>
                        <div className="text-sm text-gray-600 dark:text-gray-400">
                          Success Rate
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default ClaimsAnalyticsComponent;