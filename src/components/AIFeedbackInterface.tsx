import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import {
  CheckCircle,
  XCircle,
  Edit3,
  Brain,
  TrendingUp,
  Award,
  Star,
  Target,
  Zap,
  Trophy
} from 'lucide-react';
import { AIClassification, UserFeedback, UserStats } from '@/types';
import { enhancedAiService } from '@/lib/enhancedAiService';
import { notificationService } from '@/lib/notificationService';
import { toast } from 'sonner';

interface AIFeedbackInterfaceProps {
  itemId: string;
  classification: AIClassification;
  userId: string;
  imageUrl?: string;
  onFeedbackSubmitted?: (feedback: UserFeedback) => void;
}

export default function AIFeedbackInterface({
  itemId,
  classification,
  userId,
  imageUrl,
  onFeedbackSubmitted
}: AIFeedbackInterfaceProps) {
  const [feedbackType, setFeedbackType] = useState<'classification_correct' | 'classification_wrong' | ''>('');
  const [correctedCategory, setCorrectedCategory] = useState('');
  const [correctedSubcategory, setCorrectedSubcategory] = useState('');
  const [confidenceRating, setConfidenceRating] = useState(5);
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [userStats, setUserStats] = useState<UserStats | null>(null);
  const [showDetailedFeedback, setShowDetailedFeedback] = useState(false);

  // ... (categories and subcategories arrays remains same)
  const categories = [
    'electronics', 'clothing', 'accessories', 'bags', 'books',
    'keys', 'jewelry', 'sports_equipment', 'documents', 'toys', 'tools', 'furniture'
  ];

  const subcategories: Record<string, string[]> = {
    electronics: ['smartphone', 'laptop', 'tablet', 'headphones', 'camera', 'charger', 'gaming_device'],
    clothing: ['jacket', 'shirt', 'pants', 'shoes', 'hat', 'scarf', 'dress', 'sweater'],
    accessories: ['watch', 'sunglasses', 'belt', 'wallet', 'purse', 'bracelet'],
    bags: ['backpack', 'handbag', 'briefcase', 'duffel_bag', 'tote_bag', 'messenger_bag'],
    books: ['textbook', 'novel', 'notebook', 'magazine', 'manual', 'journal'],
    keys: ['house_keys', 'car_keys', 'office_keys', 'keychain', 'key_fob']
  };

  useEffect(() => {
    loadUserStats();
  }, [userId]);

  const loadUserStats = () => {
    // ... (keep existing implementation)
    const stored = localStorage.getItem(`user_stats_${userId}`);
    if (stored) {
      setUserStats(JSON.parse(stored));
    } else {
      const defaultStats: UserStats = {
        userId,
        trainingContributions: 0,
        accuracyImprovement: 0,
        feedbackCount: 0,
        successfulMatches: 0,
        level: 1,
        points: 0,
        badges: []
      };
      setUserStats(defaultStats);
      localStorage.setItem(`user_stats_${userId}`, JSON.stringify(defaultStats));
    }
  };

  const updateUserStats = (feedback: UserFeedback) => {
    // ... (keep existing implementation)
    if (!userStats) return;

    const pointsEarned = feedback.feedbackType === 'classification_wrong' ? 15 : 10;
    const newStats: UserStats = {
      ...userStats,
      trainingContributions: userStats.trainingContributions + 1,
      feedbackCount: userStats.feedbackCount + 1,
      points: userStats.points + pointsEarned,
      level: Math.floor((userStats.points + pointsEarned) / 100) + 1
    };

    // Award badges
    if (newStats.trainingContributions === 10 && !newStats.badges.includes('first_contributor')) {
      newStats.badges.push('first_contributor');
      toast.success('🏆 Badge Earned: First Contributor!');
    }
    if (newStats.trainingContributions === 50 && !newStats.badges.includes('ai_trainer')) {
      newStats.badges.push('ai_trainer');
      toast.success('🏆 Badge Earned: AI Trainer!');
    }
    if (newStats.feedbackCount === 100 && !newStats.badges.includes('feedback_master')) {
      newStats.badges.push('feedback_master');
      toast.success('🏆 Badge Earned: Feedback Master!');
    }

    setUserStats(newStats);
    localStorage.setItem(`user_stats_${userId}`, JSON.stringify(newStats));
  };

  const handleSubmitFeedback = async () => {
    if (!feedbackType) {
      toast.error('Please select whether the classification is correct or not');
      return;
    }

    if (feedbackType === 'classification_wrong' && !correctedCategory) {
      toast.error('Please provide the correct category');
      return;
    }

    setIsSubmitting(true);

    try {
      const feedback: UserFeedback = {
        id: `feedback_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        userId,
        itemId,
        feedbackType,
        originalPrediction: classification.category,
        userCorrection: feedbackType === 'classification_wrong' ?
          `${correctedCategory}${correctedSubcategory ? '/' + correctedSubcategory : ''}` :
          undefined,
        confidenceRating,
        timestamp: new Date().toISOString(),
        notes: notes || undefined
      };

      // Submit to AI service for training
      await enhancedAiService.processFeedback({
        itemId,
        feedbackType,
        originalPrediction: classification.category,
        userCorrection: feedback.userCorrection,
        confidenceRating,
        imageUrl // Pass image URL
      });

      // Update user stats
      updateUserStats(feedback);

      // Send thank you notification
      await notificationService.sendNotification({
        userId,
        type: 'classification_feedback',
        title: '🙏 Thank you for your feedback!',
        message: `Your feedback helps improve our AI. You earned ${feedbackType === 'classification_wrong' ? 15 : 10} points!`,
        itemId,
        data: { pointsEarned: feedbackType === 'classification_wrong' ? 15 : 10 },
        read: false,
        priority: 'low',
        channels: ['in_app']
      });

      toast.success('Feedback submitted successfully! Thank you for helping improve our AI.');

      if (onFeedbackSubmitted) {
        onFeedbackSubmitted(feedback);
      }

      // Reset form
      setFeedbackType('');
      setCorrectedCategory('');
      setCorrectedSubcategory('');
      setNotes('');
      setShowDetailedFeedback(false);

    } catch (error) {
      console.error('Error submitting feedback:', error);
      toast.error('Failed to submit feedback. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 0.9) return 'text-green-600 bg-green-100';
    if (confidence >= 0.7) return 'text-yellow-600 bg-yellow-100';
    return 'text-red-600 bg-red-100';
  };

  const getBadgeIcon = (badge: string) => {
    switch (badge) {
      case 'first_contributor': return <Star className="h-4 w-4" />;
      case 'ai_trainer': return <Brain className="h-4 w-4" />;
      case 'feedback_master': return <Trophy className="h-4 w-4" />;
      default: return <Award className="h-4 w-4" />;
    }
  };

  const getBadgeTitle = (badge: string) => {
    switch (badge) {
      case 'first_contributor': return 'First Contributor';
      case 'ai_trainer': return 'AI Trainer';
      case 'feedback_master': return 'Feedback Master';
      default: return 'Achievement';
    }
  };

  return (
    <div className="space-y-6">
      {/* AI Classification Results */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Brain className="h-5 w-5" />
            AI Classification Results
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-semibold text-lg">{classification.category}</h3>
              {classification.subcategory && (
                <p className="text-gray-600">{classification.subcategory}</p>
              )}
            </div>
            <Badge className={`${getConfidenceColor(classification.confidence)} border-0`}>
              {(classification.confidence * 100).toFixed(1)}% confident
            </Badge>
          </div>

          {classification.features && classification.features.length > 0 && (
            <div>
              <h4 className="font-medium mb-2">Detected Features:</h4>
              <div className="flex flex-wrap gap-2">
                {classification.features.map((feature, index) => (
                  <Badge key={index} variant="outline" className="text-xs">
                    {feature}
                  </Badge>
                ))}
              </div>
            </div>
          )}

          {classification.alternatives && classification.alternatives.length > 0 && (
            <div>
              <h4 className="font-medium mb-2">Alternative Classifications:</h4>
              <div className="space-y-1">
                {classification.alternatives.map((alt, index) => (
                  <div key={index} className="flex justify-between text-sm">
                    <span>{alt.category}</span>
                    <span className="text-gray-500">{(alt.confidence * 100).toFixed(1)}%</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Feedback Interface */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="h-5 w-5" />
            Help Improve AI Accuracy
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-gray-600">
            Your feedback helps our AI learn and improve! Is this classification correct?
          </p>

          <RadioGroup value={feedbackType} onValueChange={(value: string) => setFeedbackType(value as 'classification_correct' | 'classification_wrong' | '')}>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="classification_correct" id="correct" />
              <Label htmlFor="correct" className="flex items-center gap-2 cursor-pointer">
                <CheckCircle className="h-4 w-4 text-green-500" />
                Yes, it's correct
              </Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="classification_wrong" id="wrong" />
              <Label htmlFor="wrong" className="flex items-center gap-2 cursor-pointer">
                <XCircle className="h-4 w-4 text-red-500" />
                No, it's wrong
              </Label>
            </div>
          </RadioGroup>

          {feedbackType === 'classification_wrong' && (
            <div className="space-y-4 p-4 bg-gray-50 rounded-lg">
              <h4 className="font-medium">What should it be?</h4>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label>Correct Category</Label>
                  <Select value={correctedCategory} onValueChange={setCorrectedCategory}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                    <SelectContent>
                      {categories.map(category => (
                        <SelectItem key={category} value={category}>
                          {category.replace('_', ' ')}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {correctedCategory && subcategories[correctedCategory] && (
                  <div>
                    <Label>Subcategory (Optional)</Label>
                    <Select value={correctedSubcategory} onValueChange={setCorrectedSubcategory}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select subcategory" />
                      </SelectTrigger>
                      <SelectContent>
                        {subcategories[correctedCategory].map(subcategory => (
                          <SelectItem key={subcategory} value={subcategory}>
                            {subcategory.replace('_', ' ')}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}
              </div>
            </div>
          )}

          {feedbackType && (
            <div className="space-y-4">
              <Button
                variant="outline"
                onClick={() => setShowDetailedFeedback(!showDetailedFeedback)}
                className="w-full"
              >
                <Edit3 className="h-4 w-4 mr-2" />
                {showDetailedFeedback ? 'Hide' : 'Show'} Detailed Feedback
              </Button>

              {showDetailedFeedback && (
                <div className="space-y-4 p-4 border rounded-lg">
                  <div>
                    <Label>Confidence in your assessment (1-5 stars)</Label>
                    <div className="flex gap-1 mt-2">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <button
                          key={star}
                          type="button"
                          onClick={() => setConfidenceRating(star)}
                          className={`p-1 ${star <= confidenceRating ? 'text-yellow-500' : 'text-gray-300'}`}
                        >
                          <Star className="h-5 w-5 fill-current" />
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <Label>Additional Notes (Optional)</Label>
                    <Textarea
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      placeholder="Any additional details that might help improve the AI..."
                      className="mt-1"
                    />
                  </div>
                </div>
              )}

              <Button
                onClick={handleSubmitFeedback}
                disabled={isSubmitting}
                className="w-full"
              >
                {isSubmitting ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Submitting...
                  </>
                ) : (
                  <>
                    <Zap className="h-4 w-4 mr-2" />
                    Submit Feedback (+{feedbackType === 'classification_wrong' ? 15 : 10} points)
                  </>
                )}
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* User Stats & Gamification */}
      {userStats && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Your Training Contribution
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">{userStats.points}</div>
                <div className="text-sm text-gray-600">Points</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">{userStats.level}</div>
                <div className="text-sm text-gray-600">Level</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-purple-600">{userStats.trainingContributions}</div>
                <div className="text-sm text-gray-600">Contributions</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-orange-600">{userStats.accuracyImprovement.toFixed(1)}%</div>
                <div className="text-sm text-gray-600">AI Improvement</div>
              </div>
            </div>

            <div>
              <div className="flex justify-between text-sm mb-2">
                <span>Progress to Level {userStats.level + 1}</span>
                <span>{userStats.points % 100}/100</span>
              </div>
              <Progress value={(userStats.points % 100)} className="h-2" />
            </div>

            {userStats.badges.length > 0 && (
              <div>
                <h4 className="font-medium mb-2">Your Badges</h4>
                <div className="flex flex-wrap gap-2">
                  {userStats.badges.map((badge, index) => (
                    <Badge key={index} variant="secondary" className="flex items-center gap-1">
                      {getBadgeIcon(badge)}
                      {getBadgeTitle(badge)}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}