import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import ItemCard from '@/components/ItemCard';
import ClaimsManagement from '@/components/admin/ClaimsManagement';
import UserManagement from '@/components/admin/UserManagement';
import PointsMonitoring from '@/components/admin/PointsMonitoring';
import FeedbackManagement from '@/components/admin/FeedbackManagement';
import {
  ArrowLeft,
  TrendingUp,
  Users,
  CheckCircle,
  Clock,
  BarChart3,
  Download,
  RefreshCw,
  AlertTriangle,
  FileCheck,
  ShieldAlert
} from 'lucide-react';
import { itemService } from '@/services/itemService';
import { Item } from '@/types/item';
import { toast } from 'sonner';
import axios from 'axios';

interface Statistics {
  total: number;
  lost: number;
  found: number;
  resolved: number;
  active: number;
  recentItems: number;
  categories: Array<{ category: string; count: number }>;
  claims: {
    pending: number;
    approved: number;
    rejected: number;
  };
}

export default function AdminDashboard() {
  const navigate = useNavigate();
  const [statistics, setStatistics] = useState<Statistics | null>(null);
  const [recentItems, setRecentItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('adminToken');
      const config = {
        headers: { Authorization: `Bearer ${token}` }
      };

      const [statsRes, items] = await Promise.all([
        axios.get('/api/admin/stats', config),
        itemService.getRecentItems(6)
      ]);

      setStatistics(statsRes.data);
      setRecentItems(items);
    } catch (error) {
      console.error('Error loading dashboard data:', error);
      if (axios.isAxiosError(error) && (error.response?.status === 401 || error.response?.status === 403)) {
        toast.error('Session expired. Please login again.');
        localStorage.removeItem('adminToken');
        delete axios.defaults.headers.common['Authorization'];
        navigate('/admin');
        return;
      }
      toast.error('Failed to load dashboard data');
      // Fallback to mock data for demo if backend not ready
      if (!statistics) {
        setStatistics({
          total: 0, lost: 0, found: 0, resolved: 0, active: 0, recentItems: 0,
          categories: [],
          claims: { pending: 0, approved: 0, rejected: 0 }
        });
      }
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadDashboardData();
    setRefreshing(false);
    toast.success('Dashboard refreshed!');
  };

  const handleViewDetails = (item: Item) => {
    navigate(`/item/${item.id}`);
  };

  const handleContact = (item: Item) => {
    const message = `Hi ${item.contactInfo.name}, I'm contacting you regarding your ${item.type} item "${item.title}".`;
    const subject = `Admin: Regarding your ${item.type} item`;
    const mailtoLink = `mailto:${item.contactInfo.email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(message)}`;
    window.open(mailtoLink);
  };

  const handleDelete = async (itemId: string, e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent row click
    if (!window.confirm('Are you sure you want to delete this item? This action cannot be undone.')) {
      return;
    }

    try {
      await itemService.deleteItem(itemId);
      toast.success('Item deleted successfully');
      // Remove from lists
      setRecentItems(prev => prev.filter(i => i.id !== itemId));
      // Trigger refresh to update stats
      handleRefresh();
    } catch (error) {
      console.error('Error deleting item:', error);
      toast.error('Failed to delete item');
    }
  };

  const handleExportData = () => {
    toast.success('Export functionality would be implemented here');
  };

  if (loading && !statistics) {
    return (
      <div className="h-full flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  const resolutionRate = statistics ?
    Math.round((statistics.resolved / Math.max(statistics.total, 1)) * 100) : 0;

  return (
    <div className="h-full flex flex-col bg-gray-50">
      {/* Fixed Header */}
      <div className="flex-none bg-white border-b px-4 sm:px-6 py-3 sm:py-4 flex items-center justify-between z-10 w-full shadow-sm">
        <div className="flex items-center space-x-2 sm:space-x-4">
          <Button variant="ghost" size="sm" onClick={() => navigate('/')}>
            <ArrowLeft className="h-4 w-4 sm:mr-2" />
            <span className="hidden sm:inline">Back to Home</span>
          </Button>
          <div>
            <h1 className="text-lg sm:text-2xl font-bold text-gray-900">Admin Dashboard</h1>
            <p className="text-xs sm:text-sm text-gray-500 hidden sm:block">Monitor and manage lost & found items</p>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleRefresh}
            disabled={refreshing}
          >
            <RefreshCw className={`h-4 w-4 sm:mr-2 ${refreshing ? 'animate-spin' : ''}`} />
            <span className="hidden sm:inline">Refresh</span>
          </Button>
          <Button variant="outline" size="sm" onClick={handleExportData}>
            <Download className="h-4 w-4 sm:mr-2" />
            <span className="hidden sm:inline">Export</span>
          </Button>
        </div>
      </div>

      {/* Tabs with Fixed List and Scrollable Content */}
      <Tabs defaultValue="overview" className="flex-1 flex flex-col min-h-0 overflow-hidden">
        <div className="flex-none px-4 sm:px-6 py-2 bg-gray-50 border-b overflow-x-auto">
          <TabsList className="bg-white border inline-flex w-max min-w-full sm:w-auto">
            <TabsTrigger value="overview" className="text-xs sm:text-sm whitespace-nowrap">Overview</TabsTrigger>
            <TabsTrigger value="claims" className="text-xs sm:text-sm whitespace-nowrap">
              Claims
              {statistics && statistics.claims.pending > 0 && (
                <Badge variant="destructive" className="ml-1 sm:ml-2 h-5 px-1.5 text-[10px]">
                  {statistics.claims.pending}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="users" className="text-xs sm:text-sm whitespace-nowrap">Users</TabsTrigger>
            <TabsTrigger value="points" className="text-xs sm:text-sm whitespace-nowrap">Points</TabsTrigger>
            <TabsTrigger value="feedback" className="text-xs sm:text-sm whitespace-nowrap">Feedback</TabsTrigger>
            <TabsTrigger value="analytics" className="text-xs sm:text-sm whitespace-nowrap">Analytics</TabsTrigger>
          </TabsList>
        </div>

        <div className="flex-1 overflow-y-auto p-4 sm:p-6">
          <TabsContent value="overview" className="space-y-6 mt-0">
            {/* Statistics Overview Carousel - Moved Here */}
            {statistics && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <Card>
                  <CardContent className="pt-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-600">Total Items</p>
                        <p className="text-2xl font-bold text-gray-900">{statistics.total}</p>
                      </div>
                      <div className="p-3 bg-blue-100 rounded-full">
                        <TrendingUp className="h-6 w-6 text-blue-600" />
                      </div>
                    </div>
                    <div className="mt-2 text-xs text-gray-500">
                      {statistics.recentItems} added recently
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="pt-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-600">Pending Claims</p>
                        <p className="text-2xl font-bold text-gray-900">{statistics.claims.pending}</p>
                      </div>
                      <div className="p-3 bg-orange-100 rounded-full">
                        <FileCheck className="h-6 w-6 text-orange-600" />
                      </div>
                    </div>
                    <div className="mt-2 text-xs text-gray-500">
                      {statistics.claims.approved} approved total
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="pt-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-600">Resolved</p>
                        <p className="text-2xl font-bold text-gray-900">{statistics.resolved}</p>
                      </div>
                      <div className="p-3 bg-green-100 rounded-full">
                        <CheckCircle className="h-6 w-6 text-green-600" />
                      </div>
                    </div>
                    <div className="mt-2 text-xs text-gray-500">
                      {resolutionRate}% resolution rate
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="pt-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-600">Active</p>
                        <p className="text-2xl font-bold text-gray-900">{statistics.active}</p>
                      </div>
                      <div className="p-3 bg-yellow-100 rounded-full">
                        <Clock className="h-6 w-6 text-yellow-600" />
                      </div>
                    </div>
                    <div className="mt-2 text-xs text-gray-500">
                      {statistics.lost} lost, {statistics.found} found
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Recent Items */}
              <Card>
                <CardHeader>
                  <CardTitle>Recent Items</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {recentItems.length > 0 ? (
                      recentItems.map((item) => (
                        <div key={item.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                          <div className="flex items-center space-x-3 cursor-pointer" onClick={() => handleViewDetails(item)}>
                            {item.imageUrl ? (
                              <img
                                src={item.imageUrl}
                                alt={item.title}
                                className="w-10 h-10 rounded-full object-cover border border-gray-200"
                              />
                            ) : (
                              <div className={`w-10 h-10 rounded-full flex items-center justify-center ${item.type === 'lost' ? 'bg-red-100' : 'bg-blue-100'}`}>
                                <div className={`w-2 h-2 rounded-full ${item.type === 'lost' ? 'bg-red-500' : 'bg-blue-500'}`} />
                              </div>
                            )}
                            <div>
                              <p className="text-sm font-medium text-gray-900">{item.title}</p>
                              <p className="text-xs text-gray-500">{new Date(item.dateReported).toLocaleDateString()}</p>
                            </div>
                          </div>
                          <div className="flex items-center space-x-2">
                            <Badge variant="outline" className="text-xs">{item.status}</Badge>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-6 w-6 p-0 text-red-500 hover:text-red-700 hover:bg-red-50"
                              onClick={(e) => handleDelete(item.id, e)}
                            >
                              <span className="sr-only">Delete</span>
                              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-trash-2"><path d="M3 6h18" /><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" /><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" /><line x1="10" x2="10" y1="11" y2="17" /><line x1="14" x2="14" y1="11" y2="17" /></svg>
                            </Button>
                          </div>
                        </div>
                      ))
                    ) : (
                      <p className="text-center text-gray-500 py-4">No recent items</p>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* System Health */}
              <Card>
                <CardHeader>
                  <CardTitle>System Health</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex items-center space-x-3">
                        <CheckCircle className="h-5 w-5 text-green-500" />
                        <span className="font-medium">Database</span>
                      </div>
                      <Badge className="bg-green-100 text-green-800">Healthy</Badge>
                    </div>

                    <div className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex items-center space-x-3">
                        <CheckCircle className="h-5 w-5 text-green-500" />
                        <span className="font-medium">AI Service</span>
                      </div>
                      <Badge className="bg-green-100 text-green-800">Operational</Badge>
                    </div>

                    <div className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex items-center space-x-3">
                        <AlertTriangle className="h-5 w-5 text-yellow-500" />
                        <span className="font-medium">Storage</span>
                      </div>
                      <Badge className="bg-yellow-100 text-yellow-800">Local Only</Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="claims" className="mt-0 space-y-4">
            <ClaimsManagement />
          </TabsContent>

          <TabsContent value="users" className="mt-0 space-y-4">
            <UserManagement />
          </TabsContent>

          <TabsContent value="points" className="mt-0 space-y-4">
            <PointsMonitoring />
          </TabsContent>


          <TabsContent value="feedback" className="mt-0 space-y-4">
            <FeedbackManagement />
          </TabsContent>

          <TabsContent value="analytics" className="mt-0 space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Category Distribution</CardTitle>
              </CardHeader>
              <CardContent>
                {statistics?.categories && statistics.categories.length > 0 ? (
                  <div className="space-y-4">
                    {statistics.categories.map((category, index) => (
                      <div key={index} className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          <span className="font-medium capitalize">{category.category || 'Uncategorized'}</span>
                        </div>
                        <div className="flex items-center space-x-2 w-1/2">
                          <Progress
                            value={(category.count / statistics.total) * 100}
                            className="h-2 flex-1"
                          />
                          <span className="text-sm text-gray-600 w-12 text-right">{category.count}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <BarChart3 className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-600">No category data available</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </div>
      </Tabs>
    </div>
  );
}