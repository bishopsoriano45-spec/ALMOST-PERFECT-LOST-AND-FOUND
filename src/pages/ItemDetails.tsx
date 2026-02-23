import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import ClaimItemModal from '@/components/ClaimItemModal';
import { Separator } from '@/components/ui/separator';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import ItemCard from '@/components/ItemCard';
import DetectionResults from '@/components/DetectionResults';
import ItemQRCode from '@/components/ItemQRCode';
import AIFeedbackInterface from '@/components/AIFeedbackInterface';
import {
  ArrowLeft,
  MapPin,
  Calendar,
  User,
  Mail,
  Phone,
  MessageCircle,
  Share2,
  Flag,
  CheckCircle,
  Eye,
  Zap
} from 'lucide-react';
import { itemService } from '@/services/itemService';
import { Item } from '@/types/item';
import { toast } from 'sonner';
import { formatDistanceToNow } from 'date-fns';

export default function ItemDetails() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [item, setItem] = useState<Item | null>(null);
  const [matchingItems, setMatchingItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [isClaimModalOpen, setIsClaimModalOpen] = useState(false);

  useEffect(() => {
    if (id) {
      loadItemDetails(id);
    }
  }, [id]);

  const loadItemDetails = async (itemId: string) => {
    setLoading(true);
    try {
      const itemData = await itemService.getItemById(itemId);
      if (!itemData) {
        toast.error('Item not found');
        navigate('/search');
        return;
      }

      setItem(itemData);

      // Load matching items
      const matches = await itemService.getMatchingItems(itemData);
      setMatchingItems(matches);
    } catch (error) {
      console.error('Error loading item:', error);
      toast.error('Failed to load item details');
    } finally {
      setLoading(false);
    }
  };

  const handleContact = () => {
    if (!item) return;

    const message = `Hi ${item.contactInfo.name}, I saw your ${item.type} item "${item.title}" and I think I might have information about it.`;
    const subject = `Regarding your ${item.type} item: ${item.title}`;
    const mailtoLink = `mailto:${item.contactInfo.email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(message)}`;
    window.open(mailtoLink);
  };

  const handleShare = async () => {
    if (!item) return;

    const shareData = {
      title: `${item.type === 'lost' ? 'Lost' : 'Found'}: ${item.title}`,
      text: `Help reunite this ${item.type} item with its owner!`,
      url: window.location.href
    };

    try {
      if (navigator.share) {
        await navigator.share(shareData);
      } else {
        await navigator.clipboard.writeText(window.location.href);
        toast.success('Link copied to clipboard!');
      }
    } catch (error) {
      console.error('Error sharing:', error);
      toast.error('Failed to share item');
    }
  };

  const handleMarkResolved = async () => {
    if (!item) return;

    try {
      await itemService.markAsResolved(item.id);
      setItem(prev => prev ? { ...prev, status: 'resolved' } : null);
      toast.success('Item marked as resolved!');
    } catch (error) {
      console.error('Error marking as resolved:', error);
      toast.error('Failed to update item status');
    }
  };

  const handleViewMatchDetails = (matchItem: Item) => {
    navigate(`/item/${matchItem.id}`);
  };

  const handleContactMatch = (matchItem: Item) => {
    const message = `Hi ${matchItem.contactInfo.name}, I saw your ${matchItem.type} item "${matchItem.title}" and I think it might match with an item I ${item?.type === 'lost' ? 'lost' : 'found'}.`;
    const subject = `Potential match for your ${matchItem.type} item: ${matchItem.title}`;
    const mailtoLink = `mailto:${matchItem.contactInfo.email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(message)}`;
    window.open(mailtoLink);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading item details...</p>
        </div>
      </div>
    );
  }

  if (!item) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Item Not Found</h2>
          <p className="text-gray-600 mb-4">The item you're looking for doesn't exist.</p>
          <Button onClick={() => navigate('/search')}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Search
          </Button>
        </div>
      </div>
    );
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'resolved':
        return 'bg-green-100 text-green-800';
      case 'expired':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-blue-100 text-blue-800';
    }
  };

  const getTypeColor = (type: string) => {
    return type === 'lost'
      ? 'bg-red-100 text-red-800 border-red-200'
      : 'bg-green-100 text-green-800 border-green-200';
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <Button variant="ghost" onClick={() => navigate('/search')}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Search
          </Button>

          <div className="flex items-center space-x-2">
            <ItemQRCode url={window.location.href} title={item.title} />
            <Button variant="outline" size="sm" onClick={handleShare}>
              <Share2 className="h-4 w-4 mr-2" />
              Share
            </Button>
            <Button variant="outline" size="sm">
              <Flag className="h-4 w-4 mr-2" />
              Report
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Item Header */}
            <Card>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-2 mb-3">
                      <Badge className={getTypeColor(item.type)}>
                        {item.type.toUpperCase()}
                      </Badge>
                      <Badge variant="outline" className={getStatusColor(item.status)}>
                        {item.status === 'resolved' && <CheckCircle className="h-3 w-3 mr-1" />}
                        <span className="capitalize">{item.status}</span>
                      </Badge>
                    </div>

                    <h1 className="text-3xl font-bold text-gray-900 mb-2">
                      {item.title}
                    </h1>

                    <div className="flex items-center space-x-4 text-sm text-gray-600">
                      <div className="flex items-center space-x-1">
                        <MapPin className="h-4 w-4" />
                        <span>{typeof item.location === 'string' ? item.location : item.location.name}</span>
                      </div>
                      <div className="flex items-center space-x-1">
                        <Calendar className="h-4 w-4" />
                        <span>{formatDistanceToNow(new Date(item.dateReported), { addSuffix: true })}</span>
                      </div>
                      <div className="flex items-center space-x-1">
                        <Eye className="h-4 w-4" />
                        <span>ID: {item.id}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </CardHeader>
            </Card>

            {/* Images */}
            {item.imageUrl && (
              <Card>
                <CardHeader>
                  <CardTitle>Image</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {/* Main Image */}
                    <div className="aspect-video bg-gray-100 rounded-lg overflow-hidden">
                      <img
                        src={item.imageUrl}
                        alt={item.title}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Description */}
            <Card>
              <CardHeader>
                <CardTitle>Description</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-700 whitespace-pre-wrap leading-relaxed">
                  {item.description}
                </p>

                {/* Tags */}
                {item.tags.length > 0 && (
                  <div className="mt-4">
                    <h4 className="text-sm font-medium text-gray-900 mb-2">Tags:</h4>
                    <div className="flex flex-wrap gap-2">
                      {item.tags.map((tag, index) => (
                        <Badge key={index} variant="secondary">
                          {tag}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* AI Detection Results */}
            {item.detectedObjects && item.detectedObjects.length > 0 && (
              <DetectionResults objects={item.detectedObjects} />
            )}

            {/* AI Feedback Interface */}
            {item.aiClassification && (
              <Card>
                <CardHeader>
                  <CardTitle>AI Prediction Feedback</CardTitle>
                </CardHeader>
                <CardContent>
                  <AIFeedbackInterface
                    itemId={item.id}
                    classification={item.aiClassification}
                    userId={item.contactInfo.email} // Using email as user ID for now
                    imageUrl={item.imageUrl}
                  />
                </CardContent>
              </Card>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Contact Information */}
            <Card>
              <CardHeader>
                <CardTitle>Contact Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center space-x-3">
                  <Avatar>
                    <AvatarFallback>
                      {item.contactInfo.name.split(' ').map(n => n[0]).join('')}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="font-medium">{item.contactInfo.name}</p>
                    <p className="text-sm text-gray-600">Item Reporter</p>
                  </div>
                </div>

                <Separator />

                <div className="space-y-2">
                  <div className="flex items-center space-x-2 text-sm">
                    <Mail className="h-4 w-4 text-gray-400" />
                    <span>{item.contactInfo.email}</span>
                  </div>

                  {item.contactInfo.phone && (
                    <div className="flex items-center space-x-2 text-sm">
                      <Phone className="h-4 w-4 text-gray-400" />
                      <span>{item.contactInfo.phone}</span>
                    </div>
                  )}
                </div>

                {item.status === 'active' && (
                  <div className="space-y-2">
                    {item.type === 'found' ? (
                      <Button onClick={() => setIsClaimModalOpen(true)} className="w-full bg-orange-600 hover:bg-orange-700">
                        <CheckCircle className="h-4 w-4 mr-2" />
                        Claim This Item
                      </Button>
                    ) : (
                      <Button onClick={handleContact} className="w-full">
                        <MessageCircle className="h-4 w-4 mr-2" />
                        Contact Owner
                      </Button>
                    )}

                    <Button
                      variant="outline"
                      onClick={handleMarkResolved}
                      className="w-full"
                    >
                      <CheckCircle className="h-4 w-4 mr-2" />
                      Mark as Resolved
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Item Details */}
            <Card>
              <CardHeader>
                <CardTitle>Item Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Category:</span>
                  <span className="text-sm font-medium">{item.category}</span>
                </div>

                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Date Reported:</span>
                  <span className="text-sm font-medium">{item.dateReported}</span>
                </div>

                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Status:</span>
                  <Badge variant="outline" className={getStatusColor(item.status)}>
                    {item.status}
                  </Badge>
                </div>

                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Last Updated:</span>
                  <span className="text-sm font-medium">
                    {formatDistanceToNow(new Date(item.updatedAt), { addSuffix: true })}
                  </span>
                </div>
              </CardContent>
            </Card>

            {/* Potential Matches */}
            {matchingItems.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Zap className="h-5 w-5 text-yellow-500" />
                    <span>Potential Matches</span>
                  </CardTitle>
                  <p className="text-sm text-gray-600">
                    AI found {matchingItems.length} potential matches
                  </p>
                </CardHeader>
                <CardContent className="space-y-4">
                  {matchingItems.slice(0, 3).map((matchItem) => (
                    <div key={matchItem.id} className="p-3 bg-yellow-50 rounded-lg border border-yellow-200">
                      <div className="flex items-start space-x-3">
                        {matchItem.imageUrl && (
                          <img
                            src={matchItem.imageUrl}
                            alt={matchItem.title}
                            className="w-12 h-12 object-cover rounded-lg"
                          />
                        )}
                        <div className="flex-1 min-w-0">
                          <h4 className="font-medium text-sm truncate">
                            {matchItem.title}
                          </h4>
                          <p className="text-xs text-gray-600 truncate">
                            {typeof matchItem.location === 'string' ? matchItem.location : matchItem.location.name}
                          </p>
                          <div className="flex items-center space-x-2 mt-1">
                            <Badge variant="secondary" className="text-xs">
                              {matchItem.type}
                            </Badge>
                            <span className="text-xs text-yellow-700">
                              High match
                            </span>
                          </div>
                        </div>
                      </div>
                      <div className="flex space-x-2 mt-3">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleViewMatchDetails(matchItem)}
                          className="flex-1 text-xs"
                        >
                          View Details
                        </Button>
                        <Button
                          size="sm"
                          onClick={() => handleContactMatch(matchItem)}
                          className="flex-1 text-xs"
                        >
                          Contact
                        </Button>
                      </div>
                    </div>
                  ))}

                  {matchingItems.length > 3 && (
                    <Button variant="outline" size="sm" className="w-full">
                      View All {matchingItems.length} Matches
                    </Button>
                  )}
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>

      {item && (
        <ClaimItemModal
          isOpen={isClaimModalOpen}
          onClose={() => setIsClaimModalOpen(false)}
          item={item}
          type="claim"
        />
      )}
    </div>
  );
}