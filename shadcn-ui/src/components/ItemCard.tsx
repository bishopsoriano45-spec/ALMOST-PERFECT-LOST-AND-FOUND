import { Item, Match } from '@/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { MapPin, Calendar, User, Eye, CheckCircle } from 'lucide-react';
import { Link } from 'react-router-dom';

interface ItemCardProps {
  item: Item;
  match?: Match;
  showMatchScore?: boolean;
  onViewDetails?: () => void;
}

export default function ItemCard({ item, match, showMatchScore = false, onViewDetails }: ItemCardProps) {
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800';
      case 'matched': return 'bg-yellow-100 text-yellow-800';
      case 'claimed': return 'bg-gray-100 text-gray-800';
      default: return 'bg-blue-100 text-blue-800';
    }
  };

  const getTypeColor = (type: string) => {
    return type === 'lost' ? 'bg-red-100 text-red-800' : 'bg-blue-100 text-blue-800';
  };

  return (
    <Card className="hover:shadow-lg transition-shadow duration-200">
      <CardHeader className="pb-3">
        <div className="flex justify-between items-start">
          <div className="flex-1">
            <CardTitle className="text-lg font-semibold line-clamp-1">
              {item.title}
            </CardTitle>
            <div className="flex gap-2 mt-2">
              <Badge className={getTypeColor(item.type)}>
                {item.type.toUpperCase()}
              </Badge>
              <Badge className={getStatusColor(item.status)}>
                {item.status.toUpperCase()}
              </Badge>
              {item.aiClassification && (
                <Badge variant="outline">
                  AI: {item.aiClassification.category} ({Math.round(item.aiClassification.confidence * 100)}%)
                </Badge>
              )}
            </div>
          </div>
          {showMatchScore && match && (
            <div className="text-right ml-4">
              <div className="text-2xl font-bold text-green-600">
                {Math.round(match.similarityScore * 100)}%
              </div>
              <div className="text-xs text-gray-500">Match Score</div>
            </div>
          )}
        </div>
      </CardHeader>

      <CardContent className="space-y-3">
        {item.imageUrl && (
          <div className="aspect-video bg-gray-100 rounded-lg overflow-hidden">
            <img 
              src={item.imageUrl} 
              alt={item.title}
              className="w-full h-full object-cover"
            />
          </div>
        )}

        <p className="text-gray-600 text-sm line-clamp-2">
          {item.description}
        </p>

        {match && match.explanation && (
          <div className="bg-green-50 p-3 rounded-lg">
            <h4 className="font-medium text-green-800 mb-1">Why this matches:</h4>
            <ul className="text-sm text-green-700 space-y-1">
              {match.explanation.map((reason, index) => (
                <li key={index} className="flex items-center gap-2">
                  <CheckCircle className="h-3 w-3" />
                  {reason}
                </li>
              ))}
            </ul>
          </div>
        )}

        <div className="flex items-center gap-4 text-sm text-gray-500">
          <div className="flex items-center gap-1">
            <MapPin className="h-4 w-4" />
            <span className="truncate">{item.location.name}</span>
          </div>
          <div className="flex items-center gap-1">
            <Calendar className="h-4 w-4" />
            <span>{formatDate(item.dateReported)}</span>
          </div>
        </div>

        <div className="flex items-center gap-1 text-sm text-gray-500">
          <User className="h-4 w-4" />
          <span>Reported by {item.contactInfo.name}</span>
        </div>

        {item.tags.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {item.tags.slice(0, 3).map((tag, index) => (
              <Badge key={index} variant="secondary" className="text-xs">
                {tag}
              </Badge>
            ))}
            {item.tags.length > 3 && (
              <Badge variant="secondary" className="text-xs">
                +{item.tags.length - 3} more
              </Badge>
            )}
          </div>
        )}

        <div className="flex gap-2 pt-2">
          <Button 
            asChild 
            variant="outline" 
            size="sm" 
            className="flex-1"
          >
            <Link to={`/item/${item.id}`}>
              <Eye className="h-4 w-4 mr-2" />
              View Details
            </Link>
          </Button>
          {onViewDetails && (
            <Button 
              onClick={onViewDetails}
              size="sm"
              className="flex-1"
            >
              Contact Owner
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}