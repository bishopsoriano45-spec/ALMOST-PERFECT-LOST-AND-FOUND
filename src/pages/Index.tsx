import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Search, CircleAlert, CircleCheck, MapPin, TrendingUp, Clock, Shield, LogOut } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import ItemCard from '@/components/ItemCard';
import { itemService } from '@/services/itemService';
// import { getItems, getUserNotifications, getUserId, initializeSampleData } from '@/lib/storage';
import { getUserNotifications, getUserId, initializeSampleData } from '@/lib/storage'; // Keep others for now if not refactored
import { Item, Notification } from '@/types';
import FeedbackModal from '@/components/FeedbackModal';
import { MessageSquare } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';

export default function Index() {
  const navigate = useNavigate();
  const { isAuthenticated, logout, user } = useAuth();
  const [searchTerm, setSearchTerm] = useState('');
  const [items, setItems] = useState<Item[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [activeTab, setActiveTab] = useState('all');
  const [isLoading, setIsLoading] = useState(true);
  const [showFeedback, setShowFeedback] = useState(false);

  useEffect(() => {
    // Initialize sample data on first load
    // initializeSampleData(); // API doesn't need this client-side

    // Load items and notifications
    const fetchData = async () => {
      setIsLoading(true);
      try {
        console.log("[Home Debug] Fetching items...");
        const fetchedItems = await itemService.getAllItems();
        console.log("[Home Debug] Fetched items count:", fetchedItems.length);
        console.log("[Home Debug] First 3 items:", fetchedItems.slice(0, 3));
        setItems(fetchedItems);
      } catch (error) {
        console.error("Failed to fetch items", error);
      }

      try {
        const notifs = getUserNotifications(getUserId());
        console.log("[Home Debug] Notifications count:", notifs.length);
        setNotifications(notifs);
      } catch (error) {
        console.error("Failed to fetch notifications", error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, []);

  const filteredItems = items.filter(item => {
    const matchesSearch = searchTerm === '' ||
      item.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.category.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesTab = activeTab === 'all'
      ? true
      : activeTab === 'claimed'
        ? item.status === 'claimed'
        : item.type === activeTab;

    return matchesSearch && matchesTab && (item.status === 'open' || item.status === 'active' || item.status === 'matched' || item.status === 'claimed');
  });

  const recentItems = items
    .filter(item => item.status === 'open' || item.status === 'active' || item.status === 'matched' || item.status === 'claimed')
    .sort((a, b) => new Date(b.dateReported).getTime() - new Date(a.dateReported).getTime())
    .slice(0, 6);

  const stats = {
    totalLost: items.filter(item => item.type === 'lost' && (item.status === 'open' || item.status === 'active' || item.status === 'matched' || item.status === 'claimed')).length,
    totalFound: items.filter(item => item.type === 'found' && (item.status === 'open' || item.status === 'active' || item.status === 'matched' || item.status === 'claimed')).length,
    totalMatched: items.filter(item => item.status === 'matched').length,
    unreadNotifications: notifications.filter(n => !n.read).length
  };

  const popularLocations = items
    .reduce((acc, item) => {
      const location = item.location.name;
      acc[location] = (acc[location] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

  const topLocations = Object.entries(popularLocations)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 5);

  return (
    <div className="h-screen bg-gray-50 flex flex-col overflow-hidden">
      {/* Fixed Navbar */}
      <header className="bg-white shadow-sm border-b flex-none z-20 relative">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg flex items-center justify-center">
                <Search className="h-5 w-5 text-white" />
              </div>
              <h1 className="text-xl font-bold text-gray-900">AI Lost & Found</h1>
            </div>

            <div className="flex items-center gap-2">
              {/* Feedback Button */}
              <Button variant="outline" size="sm" onClick={() => setShowFeedback(true)}>
                <MessageSquare className="h-4 w-4 sm:mr-2" />
                <span className="hidden sm:inline">Feedback</span>
              </Button>

              {/* Admin Button */}
              <Button variant="outline" size="sm" asChild>
                <Link to="/admin">
                  <Shield className="h-4 w-4 sm:mr-2" />
                  <span className="hidden sm:inline">Admin</span>
                </Link>
              </Button>

              {/* Logout Button - only shown when authenticated */}
              {isAuthenticated && (
                <Button variant="outline" size="sm" onClick={() => { logout(); navigate('/'); }} className="text-red-600 border-red-200 hover:bg-red-50 hover:text-red-700">
                  <LogOut className="h-4 w-4 sm:mr-2" />
                  <span className="hidden sm:inline">Logout</span>
                </Button>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Main Content Area - Scrollable */}
      <main className="flex-1 overflow-hidden">
        <div className="h-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex flex-col gap-4">

          {/* Top Sticky Section (Hero + Search + Stats) */}
          <div className="flex-none bg-gray-50 z-10 space-y-4 pb-2">
            {/* Hero Section */}
            <div className="text-center">
              <h2 className="text-lg sm:text-2xl font-bold text-gray-900 mb-1">
                AI-Powered Lost & Found System
              </h2>
              <p className="text-xs sm:text-sm text-gray-600 mb-4">
                Advanced image recognition and smart matching to reunite you with your lost items
              </p>

              {/* Search Bar */}
              <div className="max-w-xl mx-auto relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  type="text"
                  placeholder="Search for lost or found items..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9 pr-4 py-2 text-base h-10"
                />
              </div>

              {/* Report Buttons - Below Search Bar */}
              <div className="flex justify-center gap-3 mt-3">
                <Button size="sm" asChild className="flex-1 sm:flex-none">
                  <Link to="/report-lost">
                    <CircleAlert className="h-4 w-4 mr-2" />
                    Report Lost
                  </Link>
                </Button>
                <Button variant="outline" size="sm" asChild className="flex-1 sm:flex-none">
                  <Link to="/report-found">
                    <CircleCheck className="h-4 w-4 mr-2" />
                    Report Found
                  </Link>
                </Button>
              </div>
            </div>

            {isLoading ? (
              <div className="flex justify-center py-4">
                {/* Placeholder for stats loading if needed */}
              </div>
            ) : (
              /* Stats Cards */
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2 sm:gap-4">
                <Card>
                  <CardContent className="p-2 sm:p-4 text-center">
                    <div className="text-xl font-bold text-red-600">{stats.totalLost}</div>
                    <div className="text-xs text-gray-600">Lost Items</div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-2 sm:p-4 text-center">
                    <div className="text-xl font-bold text-blue-600">{stats.totalFound}</div>
                    <div className="text-xs text-gray-600">Found Items</div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-2 sm:p-4 text-center">
                    <div className="text-xl font-bold text-green-600">{stats.totalMatched}</div>
                    <div className="text-xs text-gray-600">Successful Matches</div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-2 sm:p-4 text-center">
                    <div className="text-xl font-bold text-purple-600">{items.length}</div>
                    <div className="text-xs text-gray-600">Total Items</div>
                  </CardContent>
                </Card>
              </div>
            )}
          </div>

          {/* Lower Content: Split View (Left: Scrollable Grid, Right: Fixed Sidebar) */}
          <div className="flex-1 flex gap-4 min-h-0 overflow-hidden">
            {/* Left Column: Item Grid (Scrollable) */}
            <div className="flex-1 flex flex-col min-h-0">
              {isLoading ? (
                <div className="flex justify-center py-12 flex-1 items-center">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
                </div>
              ) : (
                <Tabs value={activeTab} onValueChange={setActiveTab} className="flex flex-col h-full">
                  <TabsList className="grid w-full grid-cols-4 flex-none mb-2 h-8">
                    <TabsTrigger value="all" className="text-xs py-0 h-full">All Items</TabsTrigger>
                    <TabsTrigger value="lost" className="text-xs py-0 h-full">Lost Items</TabsTrigger>
                    <TabsTrigger value="found" className="text-xs py-0 h-full">Found Items</TabsTrigger>
                    <TabsTrigger value="claimed" className="text-xs py-0 h-full">Claimed Items</TabsTrigger>
                  </TabsList>

                  <div className="flex-1 overflow-y-auto pr-2 pb-4">
                    <TabsContent value="all" className="mt-0">
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-2 sm:gap-4">
                        {filteredItems.map((item) => (
                          <ItemCard key={item.id} item={item} onViewDetails={(item) => navigate(`/item/${item.id}`)} />
                        ))}
                      </div>
                    </TabsContent>

                    <TabsContent value="lost" className="mt-0">
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-2 sm:gap-4">
                        {filteredItems.filter(item => item.type === 'lost').map((item) => (
                          <ItemCard key={item.id} item={item} onViewDetails={(item) => navigate(`/item/${item.id}`)} />
                        ))}
                      </div>
                    </TabsContent>

                    <TabsContent value="found" className="mt-0">
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-2 sm:gap-4">
                        {filteredItems.filter(item => item.type === 'found').map((item) => (
                          <ItemCard key={item.id} item={item} onViewDetails={(item) => navigate(`/item/${item.id}`)} />
                        ))}
                      </div>
                    </TabsContent>

                    <TabsContent value="claimed" className="mt-0">
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-2 sm:gap-4">
                        {filteredItems.map((item) => (
                          <ItemCard key={item.id} item={item} onViewDetails={(item) => navigate(`/item/${item.id}`)} />
                        ))}
                      </div>
                    </TabsContent>

                    {filteredItems.length === 0 && (
                      <div className="text-center py-12">
                        <Search className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                        <h3 className="text-lg font-medium text-gray-900 mb-2">No items found</h3>
                        <p className="text-gray-600">
                          {searchTerm ? 'Try adjusting your search terms' : 'Be the first to report an item!'}
                        </p>
                      </div>
                    )}
                  </div>
                </Tabs>
              )}
            </div>

            {/* Right Column: Sidebar (Fixed/Scrollable internally if needed) */}
            <div className="w-80 flex-none overflow-y-auto pb-4 pr-1 hidden lg:block">
              {isLoading ? null : (
                <div className="space-y-4">

                  {/* Popular Locations */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <MapPin className="h-5 w-5" />
                        Hot Spots
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2">
                      {topLocations.map(([location, count]) => (
                        <div key={location} className="flex justify-between items-center">
                          <span className="text-sm truncate">{location}</span>
                          <Badge variant="secondary">{count}</Badge>
                        </div>
                      ))}
                    </CardContent>
                  </Card>

                  {/* Quick Actions */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <TrendingUp className="h-5 w-5" />
                        Quick Actions
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2">
                      <Button variant="outline" size="sm" className="w-full justify-start" asChild>
                        <Link to="/report-lost">Report Lost Item</Link>
                      </Button>
                      <Button variant="outline" size="sm" className="w-full justify-start" asChild>
                        <Link to="/report-found">Report Found Item</Link>
                      </Button>
                      <Button variant="outline" size="sm" className="w-full justify-start" asChild>
                        <Link to="/search">Search Items</Link>
                      </Button>
                    </CardContent>
                  </Card>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
      <FeedbackModal isOpen={showFeedback} onClose={() => setShowFeedback(false)} />
    </div>
  );
}