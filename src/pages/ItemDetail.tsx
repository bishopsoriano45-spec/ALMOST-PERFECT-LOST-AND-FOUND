import { useState, useEffect } from 'react';
import QRCode from "react-qr-code";
import { useParams, useSearchParams, Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  ArrowLeft, MapPin, Calendar, User, Phone, Mail,
  CheckCircle, AlertCircle, QrCode, Share2, Eye,
  ThumbsUp, ThumbsDown, MessageCircle
} from 'lucide-react';
import { itemService } from '@/services/itemService';
import { getMatchesForItem, saveMatch, saveFeedback } from '@/lib/storage'; // Removed getItemById
import { findMatches } from '@/lib/aiService';
import { Item, Match } from '@/types';
import ItemCard from '@/components/ItemCard';
import { getImageUrl } from '@/lib/utils';
import ClaimItemModal from '@/components/ClaimItemModal';

export default function ItemDetail() {
  const { id } = useParams<{ id: string }>();
  const [searchParams] = useSearchParams();
  const [item, setItem] = useState<Item | null>(null);
  const [loading, setLoading] = useState(true);
  const [matches, setMatches] = useState<Match[]>([]);
  const [matchedItems, setMatchedItems] = useState<Record<string, Item>>({});
  const [isLoadingMatches, setIsLoadingMatches] = useState(false);
  const [showSuccess] = useState(searchParams.get('success') === 'true');
  const [claimModalOpen, setClaimModalOpen] = useState(false);
  const [claimType, setClaimType] = useState<'claim' | 'contact'>('contact');

  useEffect(() => {
    // Check for action param to auto-open modal
    if (searchParams.get('action') === 'claim') {
      setClaimType('claim');
      setClaimModalOpen(true);
    }
  }, [searchParams]);

  useEffect(() => {
    const fetchItem = async () => {
      if (id) {
        try {
          const foundItem = await itemService.getItemById(id);
          setItem(foundItem);

          if (foundItem) {
            console.log('Found item:', foundItem);
            console.log('Image URL:', foundItem.imageUrl);
            console.log('Resolved Image URL:', getImageUrl(foundItem.imageUrl));
            loadMatches(foundItem);
          }
        } catch (error) {
          console.error("Failed to fetch item details", error);
        } finally {
          setLoading(false);
        }
      }
    };
    fetchItem();
  }, [id]);

  const loadMatches = async (currentItem: Item) => {
    setIsLoadingMatches(true);
    try {
      // Get existing matches
      const existingMatches = getMatchesForItem(currentItem.id);
      let currentMatches = existingMatches;

      // If no matches exist, find new ones
      if (existingMatches.length === 0) {
        const newMatches = await findMatches(currentItem, []);
        newMatches.forEach(match => saveMatch(match));
        currentMatches = newMatches;
      }

      setMatches(currentMatches);

      // Fetch details for matched items
      const itemsMap: Record<string, Item> = {};
      await Promise.all(currentMatches.map(async (match) => {
        const matchedItem = await itemService.getItemById(match.matchedItemId);
        if (matchedItem) {
          itemsMap[match.matchedItemId] = matchedItem;
        }
      }));
      setMatchedItems(itemsMap);

    } catch (error) {
      console.error('Error loading matches:', error);
    } finally {
      setIsLoadingMatches(false);
    }
  };

  const handleMatchFeedback = (matchId: string, isCorrect: boolean) => {
    const feedback = {
      matchId,
      isCorrect,
      userId: 'current_user', // In real app, get from auth
      timestamp: new Date().toISOString(),
      notes: ''
    };

    saveFeedback(feedback);

    // Update UI to show feedback was recorded
    alert(isCorrect ? 'Thank you! This helps improve our AI.' : 'Thanks for the feedback. We\'ll improve our matching.');
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
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

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (!item) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="w-96">
          <CardContent className="p-6 text-center">
            <AlertCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-gray-900 mb-2">Item Not Found</h2>
            <p className="text-gray-600 mb-4">The item you're looking for doesn't exist or has been removed.</p>
            <Button asChild>
              <Link to="/">Return to Home</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center">
              <Button variant="ghost" size="sm" asChild>
                <Link to="/">
                  <ArrowLeft className="h-4 w-4 sm:mr-2" />
                  <span className="hidden sm:inline">Back to Home</span>
                </Link>
              </Button>
              <h1 className="ml-2 sm:ml-4 text-base sm:text-xl font-semibold text-gray-900">Item Details</h1>
            </div>

            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm">
                <Share2 className="h-4 w-4 sm:mr-2" />
                <span className="hidden sm:inline">Share</span>
              </Button>
              <Button variant="outline" size="sm">
                <QrCode className="h-4 w-4 sm:mr-2" />
                <span className="hidden sm:inline">QR Code</span>
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {showSuccess && (
          <Alert className="mb-6 border-green-200 bg-green-50">
            <CheckCircle className="h-4 w-4 text-green-600" />
            <AlertDescription className="text-green-800">
              Your item has been successfully reported! Our AI is now searching for potential matches.
            </AlertDescription>
          </Alert>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Item Details */}
          <div className="lg:col-span-2 space-y-6">
            <Card>
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="text-2xl font-bold">{item.title}</CardTitle>
                    <div className="flex gap-2 mt-3">
                      <Badge className={getTypeColor(item.type)}>
                        {item.type.toUpperCase()}
                      </Badge>
                      <Badge className={getStatusColor(item.status)}>
                        {item.status.toUpperCase()}
                      </Badge>
                      {item.verificationRequired && (
                        <Badge variant="outline" className="border-orange-200 text-orange-800">
                          Verification Required
                        </Badge>
                      )}
                    </div>
                  </div>

                  {item.aiClassification && (
                    <div className="text-right">
                      <div className="text-sm text-gray-500">AI Classification</div>
                      <div className="font-medium">
                        {item.aiClassification.category}
                      </div>
                      <div className="text-sm text-green-600">
                        {Math.round(item.aiClassification.confidence * 100)}% confidence
                      </div>
                    </div>
                  )}
                </div>
              </CardHeader>

              <CardContent className="space-y-6">
                {item.imageUrl && (
                  <div className="aspect-video bg-gray-100 rounded-lg overflow-hidden flex items-center justify-center relative">
                    <img
                      src={getImageUrl(item.imageUrl)}
                      alt={item.title}
                      className={`w-full h-full object-cover ${item.status === 'claimed' ? 'opacity-75 grayscale-[0.5]' : ''}`}
                      onError={(e) => {
                        e.currentTarget.style.display = 'none';
                        e.currentTarget.parentElement?.classList.add('bg-gray-200');
                        e.currentTarget.parentElement!.innerHTML += '<span class="text-gray-500">Image not available</span>';
                      }}
                    />
                    {item.status === 'claimed' && (
                      <div className="absolute top-4 right-4">
                        <Badge className="bg-slate-800 text-white border-0 px-3 py-1 text-xs uppercase font-bold shadow-md tracking-wider">
                          CLAIMED
                        </Badge>
                      </div>
                    )}
                  </div>
                )}

                <div>
                  <h3 className="font-semibold text-lg mb-2">Description</h3>
                  <p className="text-gray-700 leading-relaxed">{item.description}</p>
                </div>

                {item.aiClassification && item.aiClassification.features.length > 0 && (
                  <div>
                    <h3 className="font-semibold text-lg mb-2">AI Detected Features</h3>
                    <div className="flex flex-wrap gap-2">
                      {item.aiClassification.features.map((feature, index) => (
                        <Badge key={index} variant="secondary">
                          {feature}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}

                {item.tags.length > 0 && (
                  <div>
                    <h3 className="font-semibold text-lg mb-2">Tags</h3>
                    <div className="flex flex-wrap gap-2">
                      {item.tags.map((tag, index) => (
                        <Badge key={index} variant="outline">
                          {tag}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}

                <Separator />

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                  <div className="flex items-center gap-2">
                    <MapPin className="h-4 w-4 text-gray-400" />
                    <span><strong>Location:</strong> {item.location.name}</span>
                  </div>

                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-gray-400" />
                    <span><strong>Date:</strong> {formatDate(item.dateReported)}</span>
                  </div>

                  <div className="flex items-center gap-2">
                    <User className="h-4 w-4 text-gray-400" />
                    <span><strong>Reported by:</strong> {item.contactInfo.name}</span>
                  </div>

                  <div className="flex items-center gap-2">
                    <Eye className="h-4 w-4 text-gray-400" />
                    <span><strong>Category:</strong> {item.category}</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* AI Matches Section */}
            {matches.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <CheckCircle className="h-5 w-5 text-green-500" />
                    AI-Powered Matches
                  </CardTitle>
                  <p className="text-sm text-gray-600">
                    Our AI found {matches.length} potential match(es) based on image analysis and metadata comparison.
                  </p>
                </CardHeader>
                <CardContent className="space-y-4">
                  {matches.map((match) => {
                    const matchedItem = matchedItems[match.matchedItemId];
                    if (!matchedItem) return null;

                    return (
                      <div key={match.matchedItemId} className="space-y-3">
                        <ItemCard
                          item={matchedItem}
                          match={match}
                          showMatchScore={true}
                        />

                        <div className="flex items-center justify-between bg-gray-50 p-3 rounded-lg">
                          <span className="text-sm text-gray-600">Is this a correct match?</span>
                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleMatchFeedback(match.itemId, true)}
                            >
                              <ThumbsUp className="h-4 w-4 mr-1" />
                              Yes
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleMatchFeedback(match.itemId, false)}
                            >
                              <ThumbsDown className="h-4 w-4 mr-1" />
                              No
                            </Button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </CardContent>
              </Card>
            )}

            {isLoadingMatches && (
              <Card>
                <CardContent className="p-6 text-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-4"></div>
                  <p className="text-gray-600">AI is analyzing potential matches...</p>
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
              <CardContent className="space-y-3">
                <div className="flex items-center gap-2">
                  <User className="h-4 w-4 text-gray-400" />
                  <span>{item.contactInfo.name}</span>
                </div>

                <div className="flex items-center gap-2">
                  <Mail className="h-4 w-4 text-gray-400" />
                  <a
                    href={`mailto:${item.contactInfo.email}`}
                    className="text-blue-600 hover:underline"
                  >
                    {item.contactInfo.email}
                  </a>
                </div>

                {item.contactInfo.phone && (
                  <div className="flex items-center gap-2">
                    <Phone className="h-4 w-4 text-gray-400" />
                    <a
                      href={`tel:${item.contactInfo.phone}`}
                      className="text-blue-600 hover:underline"
                    >
                      {item.contactInfo.phone}
                    </a>
                  </div>
                )}

                <Separator />

                <Button className="w-full" onClick={() => { setClaimType('contact'); setClaimModalOpen(true); }}>
                  <MessageCircle className="h-4 w-4 mr-2" />
                  Contact {item.type === 'lost' ? 'Owner' : 'Finder'}
                </Button>

                {item.type === 'found' && item.status !== 'claimed' && (
                  <Button variant="outline" className="w-full" onClick={() => { setClaimType('claim'); setClaimModalOpen(true); }}>
                    <CheckCircle className="h-4 w-4 mr-2" />
                    Claim This Item
                  </Button>
                )}
                {item.status === 'claimed' && (
                  <Alert className="mt-4 bg-slate-50 border-slate-200">
                    <CheckCircle className="h-4 w-4 text-slate-600" />
                    <AlertDescription className="text-slate-800 font-medium">
                      This item has been claimed and is no longer available.
                    </AlertDescription>
                  </Alert>
                )}
              </CardContent>
            </Card>

            {/* QR Code */}
            <Card>
              <CardHeader>
                <CardTitle>Quick Access</CardTitle>
              </CardHeader>
              <CardContent className="text-center">
                <div className="flex justify-center mb-3 bg-white p-2 rounded-lg">
                  <QRCode
                    value={window.location.href}
                    size={128}
                    style={{ height: "auto", maxWidth: "100%", width: "100%" }}
                    viewBox={`0 0 256 256`}
                  />
                </div>
                <p className="text-sm text-gray-600">
                  Scan QR code to quickly access this item
                </p>
              </CardContent>
            </Card>

            {/* Safety Tips */}
            <Card>
              <CardHeader>
                <CardTitle>Safety Tips</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-sm text-gray-600">
                <div className="flex items-start gap-2">
                  <AlertCircle className="h-4 w-4 text-yellow-500 mt-0.5 flex-shrink-0" />
                  <span>Meet in public places when exchanging items</span>
                </div>
                <div className="flex items-start gap-2">
                  <AlertCircle className="h-4 w-4 text-yellow-500 mt-0.5 flex-shrink-0" />
                  <span>Verify ownership before handing over valuable items</span>
                </div>
                <div className="flex items-start gap-2">
                  <AlertCircle className="h-4 w-4 text-yellow-500 mt-0.5 flex-shrink-0" />
                  <span>Report any suspicious behavior to security</span>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {item && (
          <ClaimItemModal
            isOpen={claimModalOpen}
            onClose={() => setClaimModalOpen(false)}
            item={item}
            type={claimType}
          />
        )}
      </main>
    </div>
  );
}