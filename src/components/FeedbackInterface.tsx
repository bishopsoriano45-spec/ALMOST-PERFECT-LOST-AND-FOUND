import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Slider } from '@/components/ui/slider';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import { 
  CheckCircle, 
  XCircle, 
  Edit3, 
  Star, 
  ThumbsUp, 
  ThumbsDown, 
  AlertTriangle,
  Zap,
  Target,
  TrendingUp
} from 'lucide-react';
import { DetectedObject, UserFeedback, DetectionCorrection } from '@/types/autoLearning';
import { autoLearningService } from '@/services/autoLearningService';
import { toast } from 'sonner';

interface FeedbackInterfaceProps {
  detectedObjects: DetectedObject[];
  imageUrl: string;
  onFeedbackSubmitted?: (feedback: UserFeedback) => void;
}

export const FeedbackInterface: React.FC<FeedbackInterfaceProps> = ({
  detectedObjects,
  imageUrl,
  onFeedbackSubmitted
}) => {
  const [corrections, setCorrections] = useState<DetectionCorrection[]>([]);
  const [qualityRating, setQualityRating] = useState<number>(4);
  const [comments, setComments] = useState<string>('');
  const [selectedObject, setSelectedObject] = useState<DetectedObject | null>(null);
  const [correctionType, setCorrectionType] = useState<string>('class_change');
  const [newClass, setNewClass] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [showAdvanced, setShowAdvanced] = useState<boolean>(false);

  const commonObjects = [
    'backpack', 'handbag', 'suitcase', 'laptop', 'phone', 'tablet', 'camera',
    'keys', 'wallet', 'sunglasses', 'watch', 'headphones', 'book', 'umbrella',
    'bottle', 'cup', 'bicycle', 'skateboard', 'ball', 'shoe', 'hat', 'jacket'
  ];

  // Handle object selection for correction
  const handleObjectSelect = (obj: DetectedObject) => {
    setSelectedObject(obj);
    setNewClass(obj.class);
  };

  // Add correction
  const addCorrection = () => {
    if (!selectedObject) return;

    const correction: DetectionCorrection = {
      originalClass: selectedObject.class,
      correctedClass: newClass,
      confidence: selectedObject.confidence,
      bbox: selectedObject.bbox,
      correctionType: correctionType as DetectionCorrection['correctionType']
    };

    setCorrections(prev => [...prev, correction]);
    setSelectedObject(null);
    setNewClass('');
    toast.success('Correction added successfully');
  };

  // Remove correction
  const removeCorrection = (index: number) => {
    setCorrections(prev => prev.filter((_, i) => i !== index));
  };

  // Submit feedback
  const submitFeedback = async () => {
    setIsSubmitting(true);
    
    try {
      const feedback: UserFeedback = {
        detectionCorrections: corrections,
        qualityRating,
        comments: comments || undefined,
        timestamp: new Date().toISOString()
      };

      // Simulate processing time
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      onFeedbackSubmitted?.(feedback);
      
      // Reset form
      setCorrections([]);
      setQualityRating(4);
      setComments('');
      setSelectedObject(null);
      
      toast.success('Feedback submitted successfully! This will help improve our AI model.');
    } catch (error) {
      toast.error('Failed to submit feedback. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Calculate feedback impact score
  const getFeedbackImpact = (): number => {
    let impact = 0;
    
    // Base impact from quality rating
    impact += (qualityRating - 3) * 20; // -40 to +40
    
    // Impact from corrections
    impact += corrections.length * 15;
    
    // Bonus for detailed comments
    if (comments.length > 50) impact += 10;
    
    return Math.max(0, Math.min(100, impact + 50)); // Normalize to 0-100
  };

  return (
    <div className="space-y-6">
      {/* Detection Results Header */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Zap className="h-5 w-5 text-yellow-500" />
            AI Detection Results
          </CardTitle>
          <CardDescription>
            Review and correct the AI's object detection results to help improve the model
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {detectedObjects.map((obj, index) => (
              <div
                key={index}
                className={`p-4 border rounded-lg cursor-pointer transition-all ${
                  selectedObject === obj 
                    ? 'border-blue-500 bg-blue-50 dark:bg-blue-950' 
                    : 'border-gray-200 hover:border-gray-300'
                }`}
                onClick={() => handleObjectSelect(obj)}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="font-medium capitalize">{obj.class}</span>
                  <Badge variant={obj.confidence > 0.8 ? 'default' : 'secondary'}>
                    {(obj.confidence * 100).toFixed(1)}%
                  </Badge>
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-400">
                  Position: {obj.bbox.x}, {obj.bbox.y} | Size: {obj.bbox.width}×{obj.bbox.height}
                </div>
                <Progress value={obj.confidence * 100} className="mt-2" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Feedback Tabs */}
      <Tabs defaultValue="corrections" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="corrections">Corrections</TabsTrigger>
          <TabsTrigger value="rating">Quality Rating</TabsTrigger>
          <TabsTrigger value="advanced">Advanced</TabsTrigger>
        </TabsList>

        {/* Corrections Tab */}
        <TabsContent value="corrections" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Edit3 className="h-5 w-5" />
                Detection Corrections
              </CardTitle>
              <CardDescription>
                Correct any misidentified objects to help the AI learn
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {selectedObject && (
                <div className="p-4 bg-blue-50 dark:bg-blue-950 rounded-lg">
                  <h4 className="font-medium mb-3">
                    Correcting: <span className="capitalize">{selectedObject.class}</span>
                  </h4>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="correction-type">Correction Type</Label>
                      <Select value={correctionType} onValueChange={setCorrectionType}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="class_change">Wrong Object Class</SelectItem>
                          <SelectItem value="bbox_adjustment">Bounding Box Issue</SelectItem>
                          <SelectItem value="false_positive">False Detection</SelectItem>
                          <SelectItem value="missed_detection">Missed Object</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div>
                      <Label htmlFor="new-class">Correct Object Class</Label>
                      <Select value={newClass} onValueChange={setNewClass}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select correct class" />
                        </SelectTrigger>
                        <SelectContent>
                          {commonObjects.map(obj => (
                            <SelectItem key={obj} value={obj}>
                              {obj}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  
                  <div className="flex gap-2 mt-4">
                    <Button onClick={addCorrection} disabled={!newClass}>
                      Add Correction
                    </Button>
                    <Button variant="outline" onClick={() => setSelectedObject(null)}>
                      Cancel
                    </Button>
                  </div>
                </div>
              )}

              {/* Current Corrections */}
              {corrections.length > 0 && (
                <div>
                  <h4 className="font-medium mb-2">Current Corrections:</h4>
                  <div className="space-y-2">
                    {corrections.map((correction, index) => (
                      <div key={index} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-900 rounded-lg">
                        <div>
                          <span className="capitalize">{correction.originalClass}</span>
                          <span className="mx-2">→</span>
                          <span className="capitalize font-medium">{correction.correctedClass}</span>
                          <Badge variant="outline" className="ml-2">
                            {correction.correctionType.replace('_', ' ')}
                          </Badge>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => removeCorrection(index)}
                        >
                          <XCircle className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Quality Rating Tab */}
        <TabsContent value="rating" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Star className="h-5 w-5" />
                Overall Quality Rating
              </CardTitle>
              <CardDescription>
                Rate the overall quality of the AI detection results
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <Label className="text-base font-medium">
                  Quality Rating: {qualityRating}/5
                </Label>
                <div className="flex items-center gap-4 mt-2">
                  <Slider
                    value={[qualityRating]}
                    onValueChange={(value) => setQualityRating(value[0])}
                    max={5}
                    min={1}
                    step={0.5}
                    className="flex-1"
                  />
                  <div className="flex">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <Star
                        key={star}
                        className={`h-5 w-5 cursor-pointer ${
                          star <= qualityRating 
                            ? 'text-yellow-400 fill-current' 
                            : 'text-gray-300'
                        }`}
                        onClick={() => setQualityRating(star)}
                      />
                    ))}
                  </div>
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                  {qualityRating <= 2 && "Poor - Many errors in detection"}
                  {qualityRating > 2 && qualityRating <= 3 && "Fair - Some errors present"}
                  {qualityRating > 3 && qualityRating <= 4 && "Good - Mostly accurate"}
                  {qualityRating > 4 && "Excellent - Very accurate detection"}
                </div>
              </div>

              <div>
                <Label htmlFor="comments">Additional Comments (Optional)</Label>
                <Textarea
                  id="comments"
                  placeholder="Provide additional feedback about the detection quality..."
                  value={comments}
                  onChange={(e) => setComments(e.target.value)}
                  rows={4}
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Advanced Tab */}
        <TabsContent value="advanced" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Target className="h-5 w-5" />
                Feedback Impact Analysis
              </CardTitle>
              <CardDescription>
                See how your feedback will impact the AI learning process
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-600">
                    {corrections.length}
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">
                    Corrections Provided
                  </div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-600">
                    {getFeedbackImpact()}%
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">
                    Learning Impact Score
                  </div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-purple-600">
                    {Math.max(1, Math.floor(getFeedbackImpact() / 20))}
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">
                    Contribution Points
                  </div>
                </div>
              </div>

              <Alert>
                <TrendingUp className="h-4 w-4" />
                <AlertDescription>
                  Your feedback helps improve the AI model for everyone. High-quality corrections 
                  have the most impact on learning performance.
                </AlertDescription>
              </Alert>

              <div className="space-y-2">
                <h4 className="font-medium">Feedback Summary:</h4>
                <ul className="text-sm space-y-1 text-gray-600 dark:text-gray-400">
                  <li>• Quality Rating: {qualityRating}/5 stars</li>
                  <li>• Detection Corrections: {corrections.length}</li>
                  <li>• Comments: {comments ? 'Provided' : 'None'}</li>
                  <li>• Impact Level: {getFeedbackImpact() > 70 ? 'High' : getFeedbackImpact() > 40 ? 'Medium' : 'Low'}</li>
                </ul>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Submit Button */}
      <div className="flex justify-end">
        <Button 
          onClick={submitFeedback} 
          disabled={isSubmitting}
          size="lg"
          className="min-w-[200px]"
        >
          {isSubmitting ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
              Submitting...
            </>
          ) : (
            <>
              <CheckCircle className="h-4 w-4 mr-2" />
              Submit Feedback
            </>
          )}
        </Button>
      </div>
    </div>
  );
};

export default FeedbackInterface;