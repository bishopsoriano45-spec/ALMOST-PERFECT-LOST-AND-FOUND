import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Filter, X, Search, Calendar } from 'lucide-react'; // Ensure lucide-react is installed
import { SearchFilters as SearchFiltersType } from '@/types/item';

interface SearchFiltersProps {
  filters: SearchFiltersType;
  onFiltersChange: (filters: SearchFiltersType) => void;
  onClearFilters: () => void;
  className?: string;
}

const CATEGORIES = [
  'Bags & Accessories',
  'Electronics',
  'Personal Items',
  'Jewelry & Accessories',
  'Clothing',
  'Sports & Recreation',
  'Documents',
  'Keys & Cards',
  'Other'
];

export default function SearchFilters({
  filters = {}, // Default empty obj
  onFiltersChange,
  onClearFilters,
  className = ''
}: SearchFiltersProps) {

  // Safe update helper
  const updateFilter = (key: keyof SearchFiltersType, value: any) => {
    if (onFiltersChange) {
      onFiltersChange({
        ...filters,
        [key]: value
      });
    }
  };

  const hasActiveFilters = Object.values(filters || {}).some(value =>
    value && value !== 'all' && value !== ''
  );

  return (
    <Card className={className}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center space-x-2 text-base">
            <Filter className="h-4 w-4" />
            <span>Filters</span>
          </CardTitle>

          {hasActiveFilters && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onClearFilters}
              className="text-red-600 hover:text-red-700 h-8 px-2 text-xs"
            >
              Clear All
            </Button>
          )}
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Search Query */}
        <div className="space-y-1.5">
          <Label htmlFor="search" className="text-xs font-medium">Keywords</Label>
          <div className="relative">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-400" />
            <Input
              id="search"
              placeholder="Search..."
              value={filters.searchQuery || ''}
              onChange={(e) => updateFilter('searchQuery', e.target.value)}
              className="pl-9 h-9"
            />
          </div>
        </div>

        {/* Type Filter */}
        <div className="space-y-1.5">
          <Label className="text-xs font-medium">Type</Label>
          <Select
            value={filters.type || 'all'}
            onValueChange={(value) => updateFilter('type', value)}
          >
            <SelectTrigger className="h-9">
              <SelectValue placeholder="All" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Types</SelectItem>
              <SelectItem value="lost">Lost</SelectItem>
              <SelectItem value="found">Found</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Status Filter */}
        <div className="space-y-1.5">
          <Label className="text-xs font-medium">Status</Label>
          <Select
            value={filters.status || 'all'}
            onValueChange={(value) => updateFilter('status', value)}
          >
            <SelectTrigger className="h-9">
              <SelectValue placeholder="All" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Statuses</SelectItem>
              <SelectItem value="active">Active/Open</SelectItem>
              <SelectItem value="resolved">Resolved</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Category Filter */}
        <div className="space-y-1.5">
          <Label className="text-xs font-medium">Category</Label>
          <Select
            value={filters.category || 'all'}
            // Handle 'all' logic explicitly
            onValueChange={(value) => updateFilter('category', value === 'all' ? undefined : value)}
          >
            <SelectTrigger className="h-9">
              <SelectValue placeholder="All Categories" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Categories</SelectItem>
              {CATEGORIES.map((cat) => (
                <SelectItem key={cat} value={cat}>
                  {cat}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Location Filter */}
        <div className="space-y-1.5">
          <Label htmlFor="location" className="text-xs font-medium">Location</Label>
          <Input
            id="location"
            placeholder="e.g. Library"
            value={filters.location || ''}
            onChange={(e) => updateFilter('location', e.target.value)}
            className="h-9"
          />
        </div>

      </CardContent>
    </Card>
  );
}