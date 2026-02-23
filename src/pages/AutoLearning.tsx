import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Brain, 
  Upload, 
  Search, 
  BarChart3, 
  Settings, 
  Zap,
  TrendingUp,
  Database,
  Target,
  Users,
  Clock,
  CheckCircle,
  AlertTriangle
} from 'lucide-react';
import { yoloService } from '@/services/yoloService';
import { autoLearningService } from '@/services/autoLearningService';
import { similarityService } from '@/services/similarityService';
import FeedbackInterface from '@/components/FeedbackInterface';
import LearningDashboard from '@/components/LearningDashboard';
import { DetectedObject, UserFeedback, LearningMetrics } from '@/types/autoLearning';
import { toast } from 'sonner';

const AutoLearning: React.FC = () => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [detectedObjects, setDetectedObjects] = useState<DetectedObject[]>([]);
  const [isDetecting, setIsDetecting] = useState<boolean>(false);
  const [showFeedback, setShowFeedback] = useState<boolean>(false);
  const [learningMetrics, setLearningMetrics] = useState<LearningMetrics | null>(null);
  const [activeTab, setActiveTab] = useState<string>('detection');

  // Load learning metrics
  const loadMetrics = async () => {
    try {
      const metrics = await autoLearningService.getLearningMetrics();
      setLearningMetrics(metrics);
    } catch (error) {
      console.error('Failed to load learning metrics:', error);
    }
  };

  // Handle file selection
  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      setDetectedObjects([]);
      setShowFeedback(false);
    }
  };

  // Perform object detection
  const performDetection = async () => {
    if (!selectedFile) return;

    setIsDetecting(true);
    try {
      const response = await yoloService.detectObjects(selectedFile);
      setDetectedObjects(response.objects);
      setShowFeedback(true);
      toast.success(`Detected ${response.objects.length} objects`);
    } catch (error) {
      toast.error('Failed to detect objects');
    } finally {
      setIsDetecting(false);
    }
  };

  // Handle feedback submission
  const handleFeedbackSubmitted = async (feedback: UserFeedback) => {
    try {
      // Process feedback through auto-learning service
      await autoLearningService.processFeedback('current_detection', feedback);
      
      // Add to verified samples
      if (selectedFile) {
        await autoLearningService.addVerifiedSample({
          imageUrl: URL.createObjectURL(selectedFile),
          originalDetection: detectedObjects,
          correctedDetection: feedback.detectionCorrections.length > 0 
            ? detectedObjects.map(obj => {
                const correction = feedback.detectionCorrections.find(c => c.originalClass === obj.class);
                return correction ? { ...obj, class: correction.correctedClass } : obj;
              })
            : detectedObjects,
          userFeedback: feedback,
          verificationStatus: 'verified',
          qualityScore: 0,
          userId: 'current_user',
          category: 'General'
        });
      }

      // Reload metrics
      await loadMetrics();
      
      // Reset detection state
      setShowFeedback(false);
      setSelectedFile(null);
      setDetectedObjects([]);
      
      toast.success('Thank you! Your feedback helps improve our AI model.');
    } catch (error) {
      toast.error('Failed to process feedback');
    }
  };

  // Perform hierarchical similarity search
  const performSimilaritySearch = async () => {
    if (detectedObjects.length === 0) {
      toast.error('Please detect objects first');
      return;
    }

    try {
      const result = await similarityService.hierarchicalSearch(
        detectedObjects,
        undefined,
        { category: 'General' }
      );
      
      toast.success(`Found ${result.classMatches.length + result.visualMatches.length} similar items`);
      console.log('Similarity search result:', result);
    } catch (error) {
      toast.error('Failed to perform similarity search');
    }
  };

  useEffect(() => {
    loadMetrics();
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-4">
            Auto-Learning AI System
          </h1>
          <p className="text-xl text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
            Experience the future of AI that learns from your feedback and continuously improves its performance
          </p>
        </div>

        {/* Quick Stats */}
        {learningMetrics && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <Card className="border-l-4 border-l-green-500">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Model Accuracy</p>
                    <p className="text-2xl font-bold text-green-600">
                      {(learningMetrics.modelAccuracy * 100).toFixed(1)}%
                    </p>
                  </div>
                  <Target className="h-8 w-8 text-green-600" />
                </div>
              </CardContent>
            </Card>

            <Card className="border-l-4 border-l-blue-500">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Verified Samples</p>
                    <p className="text-2xl font-bold text-blue-600">
                      {learningMetrics.verifiedSamples.toLocaleString()}
                    </p>
                  </div>
                  <Database className="h-8 w-8 text-blue-600" />
                </div>
              </CardContent>
            </Card>

            <Card className="border-l-4 border-l-purple-500">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Contributors</p>
                    <p className="text-2xl font-bold text-purple-600">
                      {learningMetrics.userContributions.length}
                    </p>
                  </div>
                  <Users className="h-8 w-8 text-purple-600" />
                </div>
              </CardContent>
            </Card>

            <Card className="border-l-4 border-l-orange-500">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Last Training</p>
                    <p className="text-lg font-bold text-orange-600">
                      {new Date(learningMetrics.lastRetrainingDate).toLocaleDateString()}
                    </p>
                  </div>
                  <Clock className="h-8 w-8 text-orange-600" />
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Main Content Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-4 mb-8">
            <TabsTrigger value="detection" className="flex items-center gap-2">
              <Zap className="h-4 w-4" />
              AI Detection
            </TabsTrigger>
            <TabsTrigger value="similarity" className="flex items-center gap-2">
              <Search className="h-4 w-4" />
              Similarity Search
            </TabsTrigger>
            <TabsTrigger value="dashboard" className="flex items-center gap-2">
              <BarChart3 className="h-4 w-4" />
              Learning Dashboard
            </TabsTrigger>
            <TabsTrigger value="settings" className="flex items-center gap-2">
              <Settings className="h-4 w-4" />
              Configuration
            </TabsTrigger>
          </TabsList>

          {/* AI Detection Tab */}
          <TabsContent value="detection" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Brain className="h-5 w-5" />
                  YOLOv8m Object Detection with Auto-Learning
                </CardTitle>
                <CardDescription>
                  Upload an image to detect objects and provide feedback to improve the AI model
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* File Upload */}
                <div className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-8 text-center">
                  <Upload className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <div className="space-y-2">
                    <p className="text-lg font-medium">Upload an image for AI detection</p>
                    <p className="text-gray-600 dark:text-gray-400">
                      Supported formats: JPG, PNG, WebP (max 10MB)
                    </p>
                  </div>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleFileSelect}
                    className="mt-4"
                  />
                </div>

                {/* Selected File Preview */}
                {selectedFile && (
                  <Card>
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="w-16 h-16 bg-gray-100 dark:bg-gray-800 rounded-lg flex items-center justify-center">
                            <img
                              src={URL.createObjectURL(selectedFile)}
                              alt="Preview"
                              className="w-full h-full object-cover rounded-lg"
                            />
                          </div>
                          <div>
                            <p className="font-medium">{selectedFile.name}</p>
                            <p className="text-sm text-gray-600 dark:text-gray-400">
                              {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                            </p>
                          </div>
                        </div>
                        <Button 
                          onClick={performDetection} 
                          disabled={isDetecting}
                          size="lg"
                        >
                          {isDetecting ? (
                            <>
                              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                              Detecting...
                            </>
                          ) : (
                            <>
                              <Zap className="h-4 w-4 mr-2" />
                              Detect Objects
                            </>
                          )}
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* Detection Results & Feedback */}
                {showFeedback && detectedObjects.length > 0 && (
                  <FeedbackInterface
                    detectedObjects={detectedObjects}
                    imageUrl={selectedFile ? URL.createObjectURL(selectedFile) : ''}
                    onFeedbackSubmitted={handleFeedbackSubmitted}
                  />
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Similarity Search Tab */}
          <TabsContent value="similarity" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Search className="h-5 w-5" />
                  Hierarchical Similarity Search
                </CardTitle>
                <CardDescription>
                  Advanced similarity matching with class-first comparison and visual features
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <Alert>
                  <TrendingUp className="h-4 w-4" />
                  <AlertDescription>
                    Our hierarchical search combines object detection, visual similarity, and metadata 
                    matching for the most accurate results. Detect objects first to enable search.
                  </AlertDescription>
                </Alert>

                {detectedObjects.length > 0 ? (
                  <div className="space-y-4">
                    <div>
                      <h3 className="font-medium mb-2">Detected Objects for Search:</h3>
                      <div className="flex flex-wrap gap-2">
                        {detectedObjects.map((obj, index) => (
                          <Badge key={index} variant="outline" className="capitalize">
                            {obj.class} ({(obj.confidence * 100).toFixed(1)}%)
                          </Badge>
                        ))}
                      </div>
                    </div>

                    <Button onClick={performSimilaritySearch} size="lg" className="w-full">
                      <Search className="h-4 w-4 mr-2" />
                      Perform Hierarchical Search
                    </Button>
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <Search className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-lg font-medium text-gray-600 dark:text-gray-400">
                      No objects detected yet
                    </p>
                    <p className="text-gray-500">
                      Upload and detect objects first to enable similarity search
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Learning Dashboard Tab */}
          <TabsContent value="dashboard">
            <LearningDashboard />
          </TabsContent>

          {/* Configuration Tab */}
          <TabsContent value="settings" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Settings className="h-5 w-5" />
                  Auto-Learning Configuration
                </CardTitle>
                <CardDescription>
                  Configure thresholds and parameters for the auto-learning system
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Alert>
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription>
                    Configuration panel coming soon. Current system uses optimized default settings 
                    for demonstration purposes.
                  </AlertDescription>
                </Alert>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default AutoLearning;