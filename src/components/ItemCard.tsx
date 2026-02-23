import React from 'react';
import { Card, CardContent, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { MapPin, Calendar, Tag, ArrowRight } from 'lucide-react';
import { Item } from '@/types/item';
import { getImageUrl } from '@/lib/utils';
import { format } from 'date-fns';

interface ItemCardProps {
  item: Item;
  onViewDetails?: (item: Item) => void;
  onContact?: (item: Item) => void;
  className?: string; // Add className prop support
}

export default function ItemCard({ item, onViewDetails, onContact, className }: ItemCardProps) {
  // Defensive checks
  if (!item) return null;

  const formatDate = (dateString: string | undefined) => {
    if (!dateString) return 'Date unknown';
    try {
      return format(new Date(dateString), 'MMM d, yyyy');
    } catch (e) {
      return 'Invalid Date';
    }
  };

  const statusColors = {
    active: 'bg-green-100 text-green-800 border-green-200',
    resolved: 'bg-gray-100 text-gray-800 border-gray-200',
    archived: 'bg-gray-100 text-gray-800 border-gray-200',
    open: 'bg-green-100 text-green-800 border-green-200',
    matched: 'bg-blue-100 text-blue-800 border-blue-200',
    claimed: 'bg-slate-100 text-slate-800 border-slate-200', // Added claimed style
  };

  // Safe status access
  const statusKey = (item.status || 'active').toLowerCase() as keyof typeof statusColors;
  const statusClass = statusColors[statusKey] || statusColors.active;

  const hasImage = item.imageUrl && item.imageUrl !== 'null' && item.imageUrl !== 'undefined';
  const isClaimed = item.status === 'claimed';

  return (
    <Card className={`group overflow-hidden hover:shadow-lg transition-all duration-200 flex flex-col h-full bg-white border border-gray-200 ${className || ''}`}>
      {/* Image Area */}
      <div className="aspect-[2/1] w-full overflow-hidden bg-gray-200 relative">
        {hasImage ? (
          <img
            src={getImageUrl(item.imageUrl)}
            alt={item.title || 'Item Image'}
            className={`h-full w-full object-cover transition-transform duration-300 group-hover:scale-105 ${isClaimed ? 'opacity-80 grayscale-[0.5]' : ''}`}
            onError={(e) => {
              // Fallback to placeholder on error
              e.currentTarget.style.display = 'none';
              e.currentTarget.nextElementSibling?.classList.remove('hidden');
            }}
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gray-200 text-gray-400">
            <span className="text-sm font-medium">No Image</span>
          </div>
        )}

        {/* Hidden fallback div for image error */}
        <div className={`hidden w-full h-full absolute top-0 left-0 items-center justify-center bg-gray-200 text-gray-400`}>
          <span className="text-sm font-medium">No Image</span>
        </div>

        <div className="absolute top-3 right-3 flex gap-2">
          {isClaimed && (
            <Badge className="bg-slate-800 text-white border-0 px-1.5 py-0 text-[10px] uppercase font-bold shadow-sm tracking-wide">
              CLAIMED
            </Badge>
          )}
          <Badge className={`${item.type === 'lost' ? 'bg-red-500' : 'bg-blue-500'} text-white border-0 px-1.5 py-0 text-[10px] uppercase font-bold shadow-sm tracking-wide`}>
            {item.type === 'lost' ? 'LOST' : 'FOUND'}
          </Badge>
        </div>
      </div>

      <CardContent className="p-2 flex-1 flex flex-col gap-1">
        <div className="flex justify-between items-start gap-1">
          <CardTitle className="line-clamp-1 text-sm font-bold text-gray-900 group-hover:text-blue-600 transition-colors" title={item.title}>
            {item.title || 'Untitled Item'}
          </CardTitle>
          <Badge variant="secondary" className={`${statusClass} flex-shrink-0 capitalize px-1 py-0 rounded-full text-[9px] font-medium h-4`}>
            {item.status || 'Open'}
          </Badge>
        </div>

        <CardDescription className="line-clamp-1 text-[10px] text-gray-500 flex-1 leading-tight">
          {item.description || 'No description provided.'}
        </CardDescription>

        <div className="flex flex-wrap gap-x-2 gap-y-0.5 mt-1 pt-1 border-t border-gray-50">
          <div className="flex items-center text-[9px] text-gray-500">
            <MapPin className="h-2.5 w-2.5 mr-1 text-gray-400 shrink-0" />
            <span className="truncate max-w-[80px]" title={typeof item.location === 'object' ? item.location.name : item.location}>
              {typeof item.location === 'object' ? (item.location.name || 'Unknown Location') : (item.location || 'Unknown Location')}
            </span>
          </div>

          <div className="flex items-center text-[9px] text-gray-500">
            <Calendar className="h-2.5 w-2.5 mr-1 text-gray-400 shrink-0" />
            <span>{formatDate(item.dateReported)}</span>
          </div>
        </div>
      </CardContent>

      <div className="p-2 pt-0 mt-auto">
        <Button
          className="w-full bg-slate-900 hover:bg-slate-800 text-white text-[10px] h-6 font-medium"
          onClick={() => onViewDetails && onViewDetails(item)}
        >
          View
          <ArrowRight className="h-2.5 w-2.5 ml-1" />
        </Button>
      </div>
    </Card>
  );
}