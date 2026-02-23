import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Plus, Search, Filter } from 'lucide-react';
import { Link } from 'react-router-dom';
import ItemCard from '@/components/ItemCard';
import { getUserId } from '@/lib/storage';
import { itemService } from '@/services/itemService';
import { Item } from '@/types';

export default function MyItems() {
  const [items, setItems] = useState<Item[]>([]);
  const [activeTab, setActiveTab] = useState('all');

  useEffect(() => {
    const fetchItems = async () => {
      const userId = getUserId();
      try {
        const userItems = await itemService.getUserItems(userId);
        setItems(userItems);
      } catch (error) {
        console.error("Failed to fetch user items:", error);
      }
    };
    fetchItems();
  }, []);

  const filteredItems = items.filter(item => {
    if (activeTab === 'all') return true;
    if (activeTab === 'lost') return item.type === 'lost';
    if (activeTab === 'found') return item.type === 'found';
    if (activeTab === 'active') return item.status === 'active';
    if (activeTab === 'matched') return item.status === 'matched';
    if (activeTab === 'claimed') return item.status === 'claimed';
    return true;
  });

  const stats = {
    total: items.length,
    lost: items.filter(item => item.type === 'lost').length,
    found: items.filter(item => item.type === 'found').length,
    active: items.filter(item => item.status === 'active').length,
    matched: items.filter(item => item.status === 'matched').length,
    claimed: items.filter(item => item.status === 'claimed').length
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center">
              <Button variant="ghost" size="sm" asChild>
                <Link to="/">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back to Home
                </Link>
              </Button>
              <h1 className="ml-4 text-xl font-semibold text-gray-900">My Items</h1>
            </div>

            <div className="flex items-center gap-2">
              <Button size="sm" asChild>
                <Link to="/report-lost">
                  <Plus className="h-4 w-4 mr-2" />
                  Report Lost
                </Link>
              </Button>
              <Button variant="outline" size="sm" asChild>
                <Link to="/report-found">
                  <Plus className="h-4 w-4 mr-2" />
                  Report Found
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats Overview */}
        <div className="grid grid-cols-2 md:grid-cols-6 gap-4 mb-8">
          <Card>
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-gray-900">{stats.total}</div>
              <div className="text-sm text-gray-600">Total Items</div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-red-600">{stats.lost}</div>
              <div className="text-sm text-gray-600">Lost</div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-blue-600">{stats.found}</div>
              <div className="text-sm text-gray-600">Found</div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-green-600">{stats.active}</div>
              <div className="text-sm text-gray-600">Active</div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-yellow-600">{stats.matched}</div>
              <div className="text-sm text-gray-600">Matched</div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-gray-600">{stats.claimed}</div>
              <div className="text-sm text-gray-600">Claimed</div>
            </CardContent>
          </Card>
        </div>

        {/* Items List */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Your Reported Items</CardTitle>
              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm">
                  <Search className="h-4 w-4 mr-2" />
                  Search
                </Button>
                <Button variant="outline" size="sm">
                  <Filter className="h-4 w-4 mr-2" />
                  Filter
                </Button>
              </div>
            </div>
          </CardHeader>

          <CardContent>
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="grid w-full grid-cols-6">
                <TabsTrigger value="all">
                  All
                  <Badge variant="secondary" className="ml-2">{stats.total}</Badge>
                </TabsTrigger>
                <TabsTrigger value="lost">
                  Lost
                  <Badge variant="secondary" className="ml-2">{stats.lost}</Badge>
                </TabsTrigger>
                <TabsTrigger value="found">
                  Found
                  <Badge variant="secondary" className="ml-2">{stats.found}</Badge>
                </TabsTrigger>
                <TabsTrigger value="active">
                  Active
                  <Badge variant="secondary" className="ml-2">{stats.active}</Badge>
                </TabsTrigger>
                <TabsTrigger value="matched">
                  Matched
                  <Badge variant="secondary" className="ml-2">{stats.matched}</Badge>
                </TabsTrigger>
                <TabsTrigger value="claimed">
                  Claimed
                  <Badge variant="secondary" className="ml-2">{stats.claimed}</Badge>
                </TabsTrigger>
              </TabsList>

              <TabsContent value={activeTab} className="mt-6">
                {filteredItems.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filteredItems.map((item) => (
                      <ItemCard key={item.id} item={item} />
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <Search className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">
                      No items found
                    </h3>
                    <p className="text-gray-600 mb-6">
                      {activeTab === 'all'
                        ? "You haven't reported any items yet."
                        : `No ${activeTab} items found.`
                      }
                    </p>
                    <div className="flex gap-3 justify-center">
                      <Button asChild>
                        <Link to="/report-lost">
                          <Plus className="h-4 w-4 mr-2" />
                          Report Lost Item
                        </Link>
                      </Button>
                      <Button variant="outline" asChild>
                        <Link to="/report-found">
                          <Plus className="h-4 w-4 mr-2" />
                          Report Found Item
                        </Link>
                      </Button>
                    </div>
                  </div>
                )}
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>

        {/* Help Section */}
        {items.length > 0 && (
          <Card className="mt-8">
            <CardHeader>
              <CardTitle>Need Help?</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                <div className="p-4 bg-blue-50 rounded-lg">
                  <h4 className="font-medium text-blue-900 mb-2">Item Status Guide</h4>
                  <ul className="space-y-1 text-blue-700">
                    <li><strong>Active:</strong> Currently searchable</li>
                    <li><strong>Matched:</strong> Potential match found</li>
                    <li><strong>Claimed:</strong> Item recovered</li>
                  </ul>
                </div>

                <div className="p-4 bg-green-50 rounded-lg">
                  <h4 className="font-medium text-green-900 mb-2">Improve Matching</h4>
                  <ul className="space-y-1 text-green-700">
                    <li>Add clear photos</li>
                    <li>Include detailed descriptions</li>
                    <li>Use relevant tags</li>
                  </ul>
                </div>

                <div className="p-4 bg-purple-50 rounded-lg">
                  <h4 className="font-medium text-purple-900 mb-2">Safety Tips</h4>
                  <ul className="space-y-1 text-purple-700">
                    <li>Meet in public places</li>
                    <li>Verify ownership</li>
                    <li>Report suspicious activity</li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </main>
    </div>
  );
}