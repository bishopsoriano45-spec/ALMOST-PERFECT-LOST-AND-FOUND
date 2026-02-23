import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import ItemCard from '@/components/ItemCard';
import SearchFilters from '@/components/SearchFilters';
import { ArrowLeft, Search, Filter } from 'lucide-react';
import { itemService } from '@/services/itemService';
import { Item, SearchFilters as SearchFiltersType } from '@/types/item';
import { toast } from 'sonner';

export default function SearchItems() {
  const navigate = useNavigate();
  const [items, setItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(true);
  const [showFilters, setShowFilters] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [filters, setFilters] = useState<SearchFiltersType>({
    type: 'all',
    status: 'all' // Explicitly default to 'all' to ensure data visibility
  });

  useEffect(() => {
    loadItems();
  }, [filters]);

  const loadItems = async () => {
    setLoading(true);
    setError(null);
    try {
      console.log('Fetching items with filters:', filters);
      const searchResults = await itemService.searchItems(filters);
      console.log('Items fetched:', searchResults.length, searchResults);
      setItems(searchResults || []);
    } catch (err: any) {
      console.error('Error loading items:', err);
      // Even on error, we set items to empty array to avoid crash
      setItems([]);
      setError(err.message || 'Failed to connect to server');
      toast.error('Failed to load items');
    } finally {
      setLoading(false);
    }
  };

  const handleFiltersChange = (newFilters: SearchFiltersType) => {
    setFilters(newFilters);
  };

  const handleClearFilters = () => {
    setFilters({
      type: 'all',
      status: 'all'
    });
  };

  const handleViewDetails = (item: Item) => {
    navigate(`/item/${item.id}`);
  };

  // Safe filter summary generation
  const getFilterSummary = () => {
    try {
      const activeFilters = [];
      if (filters.type && filters.type !== 'all') activeFilters.push(filters.type);
      if (filters.status && filters.status !== 'all') activeFilters.push(filters.status);
      if (filters.category && filters.category !== 'all') activeFilters.push(filters.category);
      if (filters.location) activeFilters.push(`near ${filters.location}`);
      if (filters.searchQuery) activeFilters.push(`"${filters.searchQuery}"`);

      return activeFilters.length > 0 ? activeFilters.join(', ') : 'all items';
    } catch (e) {
      return 'items';
    }
  };

  // Render content safely
  const renderContent = () => {
    if (loading) {
      return (
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      );
    }

    if (error) {
      return (
        <Card className="border-red-200 bg-red-50">
          <CardContent className="text-center py-8">
            <p className="text-red-600 font-medium mb-2">Something went wrong</p>
            <p className="text-gray-600 text-sm mb-4">{error}</p>
            <Button variant="outline" onClick={loadItems}>Try Again</Button>
          </CardContent>
        </Card>
      );
    }

    if (!items || items.length === 0) {
      return (
        <Card>
          <CardContent className="text-center py-12">
            <Search className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              No items found
            </h3>
            <p className="text-gray-600 mb-4">
              Try adjusting your search filters.
            </p>
            <Button variant="outline" onClick={handleClearFilters}>
              Clear Filters
            </Button>
          </CardContent>
        </Card>
      );
    }

    // Grid Render
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {items.map((item) => (
          <ItemCard
            key={item.id}
            item={item}
            onViewDetails={() => handleViewDetails(item)}
          />
        ))}
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
          <div className="flex items-center space-x-4">
            <Button variant="ghost" onClick={() => navigate('/')} className="hover:bg-gray-100">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Button>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Search Items</h1>
              <p className="text-gray-600 text-sm mt-1">
                Showing {items?.length || 0} results for {getFilterSummary()}
              </p>
            </div>
          </div>

          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowFilters(!showFilters)}
            className="lg:hidden w-full md:w-auto"
          >
            <Filter className="h-4 w-4 mr-2" />
            {showFilters ? 'Hide Filters' : 'Show Filters'}
          </Button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Filters Sidebar - Hidden on mobile unless toggled */}
          <div className={`lg:block ${showFilters ? 'block' : 'hidden'} lg:col-span-1`}>
            <div className="sticky top-4">
              <SearchFilters
                filters={filters}
                onFiltersChange={handleFiltersChange}
                onClearFilters={handleClearFilters}
              />
            </div>
          </div>

          {/* Results Area */}
          <div className="lg:col-span-3">
            {renderContent()}
          </div>
        </div>
      </div>
    </div>
  );
}