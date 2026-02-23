import { useState, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Progress } from '@/components/ui/progress';
import { useDropzone } from 'react-dropzone';
import {
  Upload,
  Image as ImageIcon,
  MapPin,
  Calendar,
  Brain,
  Loader2,
  CheckCircle,
  AlertCircle,
  Sparkles,
  Eye,
  Bell
} from 'lucide-react';
import { AIClassification, Item, SimilaritySearchResult } from '@/types';
import { enhancedAiService } from '@/lib/enhancedAiService';
import { notificationService } from '@/lib/notificationService';
import { itemService } from '@/services/itemService';
// import { getItems, saveItem } from '@/lib/storage';
import { toast } from 'sonner';
import AIFeedbackInterface from './AIFeedbackInterface';

interface EnhancedItemUploadProps {
  type: 'lost' | 'found';
  onItemCreated?: (item: Item) => void;
}

export default function EnhancedItemUpload({ type, onItemCreated }: EnhancedItemUploadProps) {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: '',
    location: '',
    date: new Date().toISOString().split('T')[0],
    contactName: '',
    contactEmail: '',
    contactPhone: '',
    tags: [] as string[],
    enableNotifications: true,
    allowOthersToBeNotified: true
  });

  const [uploadedImage, setUploadedImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string>('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingStep, setProcessingStep] = useState('');
  const [aiClassification, setAiClassification] = useState<AIClassification | null>(null);
  const [similarItems, setSimilarItems] = useState<SimilaritySearchResult[]>([]);
  const [showFeedback, setShowFeedback] = useState(false);
  const [createdItem, setCreatedItem] = useState<Item | null>(null);

  const onDrop = useCallback((acceptedFiles: File[]) => {
    const file = acceptedFiles[0];
    if (file) {
      setUploadedImage(file);
      const reader = new FileReader();
      reader.onload = (e) => {
        setImagePreview(e.target?.result as string);
      };
      reader.readAsDataURL(file);

      // Auto-process the image
      processImage(file);
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/*': ['.jpeg', '.jpg', '.png', '.gif', '.webp']
    },
    maxFiles: 1
  });

  const processImage = async (file: File) => {
    setIsProcessing(true);
    setProcessingStep('Analyzing image...');

    try {
      // Step 1: AI Classification
      const imageUrl = URL.createObjectURL(file);
      const classification = await enhancedAiService.classifyImage(imageUrl, {
        description: formData.description
      });

      setAiClassification(classification);

      // Auto-fill form based on AI classification
      setFormData(prev => ({
        ...prev,
        category: classification.category,
        title: prev.title || `${type === 'lost' ? 'Lost' : 'Found'} ${classification.subcategory || classification.category}`,
        tags: [...prev.tags, classification.category, ...(classification.subcategory ? [classification.subcategory] : [])]
      }));

      setProcessingStep('Searching for similar items...');

      // Step 2: Generate embedding and find similar items
      const embedding = await enhancedAiService.generateEmbedding(imageUrl);

      // Create temporary item for similarity search
      const tempItem: Item = {
        id: 'temp',
        type,
        title: formData.title || classification.category,
        description: formData.description,
        category: classification.category,
        location: { name: formData.location },
        dateReported: formData.date,
        contactInfo: {
          name: formData.contactName,
          email: formData.contactEmail,
          phone: formData.contactPhone
        },
        status: 'active',
        tags: [classification.category, ...(classification.subcategory ? [classification.subcategory] : [])],
        aiClassification: classification,
        verificationRequired: false,
        embedding
      };

      const allItems = await itemService.getAllItems();
      // const similar = await enhancedAiService.findSimilarItems(tempItem, allItems, 0.6);
      // For now, since findSimilarItems is client-side mock logic on 'allItems', we can keep it if allItems is fetched.
      // But ideally we move similarity search to backend.
      // temp workaround: fetch all items and use client logic
      const similar: SimilaritySearchResult[] = []; // Disabled client-side similarity for now to avoid errors matching types
      setSimilarItems(similar);

      setProcessingStep('Complete!');
      toast.success(`AI classified your item as "${classification.category}" with ${(classification.confidence * 100).toFixed(1)}% confidence`);

    } catch (error) {
      console.error('Error processing image:', error);
      toast.error('Failed to process image. Please try again.');
    } finally {
      setIsProcessing(false);
      setProcessingStep('');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!uploadedImage || !aiClassification) {
      toast.error('Please upload an image first');
      return;
    }

    setIsProcessing(true);
    setProcessingStep('Creating item...');

    try {
      // Generate embedding for the final item
      const imageUrl = URL.createObjectURL(uploadedImage);
      const embedding = await enhancedAiService.generateEmbedding(imageUrl);

      const newItem: Item = {
        id: `item_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        type,
        title: formData.title,
        description: formData.description,
        category: formData.category || aiClassification.category,
        imageUrl: imagePreview,
        location: { name: formData.location },
        dateReported: formData.date,
        contactInfo: {
          name: formData.contactName,
          email: formData.contactEmail,
          phone: formData.contactPhone
        },
        status: 'active',
        tags: formData.tags,
        aiClassification,
        verificationRequired: false,
        embedding,
        confidenceScore: aiClassification.confidence
      };

      // Save the item
      const savedItem = await itemService.createItem(newItem);
      setCreatedItem(savedItem);
      // setCreatedItem(newItem);

      setProcessingStep('Checking for matches...');

      // Check for matches and send notifications
      if (similarItems.length > 0 && formData.allowOthersToBeNotified) {
        for (const similar of similarItems.slice(0, 3)) { // Notify top 3 matches
          await notificationService.sendMatchNotification(
            {
              itemId: newItem.id,
              matchedItemId: similar.item.id,
              similarityScore: similar.similarityScore,
              matchType: similar.matchType,
              confidence: similar.similarityScore,
              explanation: similar.explanation,
              timestamp: new Date().toISOString(),
              autoDetected: true
            },
            type === 'lost' ? newItem : similar.item,
            type === 'found' ? newItem : similar.item
          );
        }
      }

      // Request feedback after a short delay
      setTimeout(() => {
        notificationService.sendFeedbackRequest(
          formData.contactEmail,
          newItem.id,
          aiClassification.category
        );
      }, 5000);

      toast.success(`${type === 'lost' ? 'Lost' : 'Found'} item reported successfully!`);

      if (onItemCreated) {
        onItemCreated(newItem);
      }

      // Show feedback interface
      setShowFeedback(true);

    } catch (error) {
      console.error('Error creating item:', error);
      toast.error('Failed to create item. Please try again.');
    } finally {
      setIsProcessing(false);
      setProcessingStep('');
    }
  };

  const addTag = (tag: string) => {
    if (tag && !formData.tags.includes(tag)) {
      setFormData(prev => ({
        ...prev,
        tags: [...prev.tags, tag]
      }));
    }
  };

  const removeTag = (tag: string) => {
    setFormData(prev => ({
      ...prev,
      tags: prev.tags.filter(t => t !== tag)
    }));
  };

  if (showFeedback && createdItem && aiClassification) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-green-600 mb-2">
            ✅ Item Successfully Reported!
          </h2>
          <p className="text-gray-600">
            Your {type} item has been added to the system. Help us improve by providing feedback on the AI classification.
          </p>
        </div>

        <AIFeedbackInterface
          itemId={createdItem.id}
          classification={aiClassification}
          userId={formData.contactEmail}
          imageUrl={createdItem.imageUrl}
          onFeedbackSubmitted={() => {
            toast.success('Thank you for your feedback!');
            // Reset form or redirect
            window.location.href = '/';
          }}
        />

        <div className="mt-6 text-center">
          <Button variant="outline" onClick={() => window.location.href = '/'}>
            Return to Dashboard
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Upload className="h-6 w-6" />
            Report {type === 'lost' ? 'Lost' : 'Found'} Item
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Image Upload Section */}
            <div className="space-y-4">
              <Label className="text-base font-medium">Upload Image</Label>

              <div
                {...getRootProps()}
                className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${isDragActive ? 'border-blue-500 bg-blue-50' : 'border-gray-300 hover:border-gray-400'
                  }`}
              >
                <input {...getInputProps()} />
                {imagePreview ? (
                  <div className="space-y-4">
                    <img
                      src={imagePreview}
                      alt="Preview"
                      className="max-w-xs max-h-48 mx-auto rounded-lg shadow-md"
                    />
                    <p className="text-sm text-gray-600">Click or drag to replace image</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <ImageIcon className="h-12 w-12 text-gray-400 mx-auto" />
                    <div>
                      <p className="text-lg font-medium">
                        {isDragActive ? 'Drop the image here' : 'Drag & drop an image here'}
                      </p>
                      <p className="text-gray-600">or click to select a file</p>
                    </div>
                  </div>
                )}
              </div>

              {/* Processing Status */}
              {isProcessing && (
                <Card className="bg-blue-50 border-blue-200">
                  <CardContent className="p-4">
                    <div className="flex items-center gap-3">
                      <Loader2 className="h-5 w-5 animate-spin text-blue-600" />
                      <div className="flex-1">
                        <p className="font-medium text-blue-900">Processing Image...</p>
                        <p className="text-sm text-blue-700">{processingStep}</p>
                      </div>
                    </div>
                    <Progress value={processingStep.includes('Complete') ? 100 : 50} className="mt-3" />
                  </CardContent>
                </Card>
              )}

              {/* AI Classification Results */}
              {aiClassification && (
                <Card className="bg-green-50 border-green-200">
                  <CardContent className="p-4">
                    <div className="flex items-start gap-3">
                      <Brain className="h-5 w-5 text-green-600 mt-1" />
                      <div className="flex-1">
                        <h4 className="font-medium text-green-900 mb-2">AI Classification Results</h4>
                        <div className="flex items-center gap-2 mb-2">
                          <Badge className="bg-green-100 text-green-800 border-green-300">
                            {aiClassification.category}
                          </Badge>
                          {aiClassification.subcategory && (
                            <Badge variant="outline" className="border-green-300">
                              {aiClassification.subcategory}
                            </Badge>
                          )}
                          <Badge className="bg-blue-100 text-blue-800 border-blue-300">
                            {(aiClassification.confidence * 100).toFixed(1)}% confident
                          </Badge>
                        </div>
                        {aiClassification.features && (
                          <div className="text-sm text-green-700">
                            <strong>Detected features:</strong> {aiClassification.features.join(', ')}
                          </div>
                        )}
                      </div>
                      <CheckCircle className="h-5 w-5 text-green-600" />
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Similar Items Found */}
              {similarItems.length > 0 && (
                <Card className="bg-yellow-50 border-yellow-200">
                  <CardContent className="p-4">
                    <div className="flex items-start gap-3">
                      <Eye className="h-5 w-5 text-yellow-600 mt-1" />
                      <div className="flex-1">
                        <h4 className="font-medium text-yellow-900 mb-2">
                          Found {similarItems.length} Similar Items
                        </h4>
                        <div className="space-y-2">
                          {similarItems.slice(0, 3).map((similar, index) => (
                            <div key={index} className="flex justify-between items-center text-sm">
                              <span className="text-yellow-800">
                                {similar.item.title} - {similar.item.location.name}
                              </span>
                              <Badge variant="outline" className="border-yellow-300">
                                {(similar.similarityScore * 100).toFixed(1)}% match
                              </Badge>
                            </div>
                          ))}
                        </div>
                        <p className="text-xs text-yellow-700 mt-2">
                          We'll notify the owners of these items about your {type} item.
                        </p>
                      </div>
                      <AlertCircle className="h-5 w-5 text-yellow-600" />
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>

            {/* Form Fields */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div>
                  <Label htmlFor="title">Item Title *</Label>
                  <Input
                    id="title"
                    value={formData.title}
                    onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                    placeholder={`What did you ${type}?`}
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="category">Category</Label>
                  <Select
                    value={formData.category}
                    onValueChange={(value) => setFormData(prev => ({ ...prev, category: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="electronics">Electronics</SelectItem>
                      <SelectItem value="clothing">Clothing</SelectItem>
                      <SelectItem value="accessories">Accessories</SelectItem>
                      <SelectItem value="bags">Bags</SelectItem>
                      <SelectItem value="books">Books</SelectItem>
                      <SelectItem value="keys">Keys</SelectItem>
                      <SelectItem value="jewelry">Jewelry</SelectItem>
                      <SelectItem value="sports_equipment">Sports Equipment</SelectItem>
                      <SelectItem value="documents">Documents</SelectItem>
                      <SelectItem value="toys">Toys</SelectItem>
                      <SelectItem value="tools">Tools</SelectItem>
                      <SelectItem value="furniture">Furniture</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="location">Location *</Label>
                  <div className="relative">
                    <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <Input
                      id="location"
                      value={formData.location}
                      onChange={(e) => setFormData(prev => ({ ...prev, location: e.target.value }))}
                      placeholder="Where was it lost/found?"
                      className="pl-10"
                      required
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="date">Date</Label>
                  <div className="relative">
                    <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <Input
                      id="date"
                      type="date"
                      value={formData.date}
                      onChange={(e) => setFormData(prev => ({ ...prev, date: e.target.value }))}
                      className="pl-10"
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <Label htmlFor="description">Description *</Label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                    placeholder="Describe the item in detail..."
                    rows={4}
                    required
                  />
                  {aiClassification && (
                    <div className="mt-2">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          const suggestion = `${aiClassification.category} with ${aiClassification.features?.join(', ')}`;
                          setFormData(prev => ({
                            ...prev,
                            description: prev.description + (prev.description ? '. ' : '') + suggestion
                          }));
                        }}
                      >
                        <Sparkles className="h-3 w-3 mr-1" />
                        Add AI Suggestions
                      </Button>
                    </div>
                  )}
                </div>

                <div>
                  <Label htmlFor="contactName">Your Name *</Label>
                  <Input
                    id="contactName"
                    value={formData.contactName}
                    onChange={(e) => setFormData(prev => ({ ...prev, contactName: e.target.value }))}
                    placeholder="Full name"
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="contactEmail">Email *</Label>
                  <Input
                    id="contactEmail"
                    type="email"
                    value={formData.contactEmail}
                    onChange={(e) => setFormData(prev => ({ ...prev, contactEmail: e.target.value }))}
                    placeholder="your@email.com"
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="contactPhone">Phone (Optional)</Label>
                  <Input
                    id="contactPhone"
                    type="tel"
                    value={formData.contactPhone}
                    onChange={(e) => setFormData(prev => ({ ...prev, contactPhone: e.target.value }))}
                    placeholder="+1 (555) 123-4567"
                  />
                </div>
              </div>
            </div>

            {/* Tags */}
            <div>
              <Label>Tags</Label>
              <div className="flex flex-wrap gap-2 mt-2">
                {formData.tags.map((tag, index) => (
                  <Badge key={index} variant="secondary" className="cursor-pointer" onClick={() => removeTag(tag)}>
                    {tag} ×
                  </Badge>
                ))}
              </div>
              <Input
                placeholder="Add tags (press Enter)"
                className="mt-2"
                onKeyPress={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    const target = e.target as HTMLInputElement;
                    addTag(target.value.trim());
                    target.value = '';
                  }
                }}
              />
            </div>

            {/* Notification Settings */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <Bell className="h-5 w-5" />
                  Notification Settings
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <Label>Notify me of similar items</Label>
                    <p className="text-sm text-gray-600">Get alerts when similar items are uploaded</p>
                  </div>
                  <Switch
                    checked={formData.enableNotifications}
                    onCheckedChange={(checked) => setFormData(prev => ({ ...prev, enableNotifications: checked }))}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <Label>Allow others to be notified</Label>
                    <p className="text-sm text-gray-600">Let owners of similar items know about this item</p>
                  </div>
                  <Switch
                    checked={formData.allowOthersToBeNotified}
                    onCheckedChange={(checked) => setFormData(prev => ({ ...prev, allowOthersToBeNotified: checked }))}
                  />
                </div>
              </CardContent>
            </Card>

            {/* Submit Button */}
            <Button
              type="submit"
              className="w-full"
              size="lg"
              disabled={isProcessing || !uploadedImage}
            >
              {isProcessing ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  {processingStep || 'Processing...'}
                </>
              ) : (
                <>
                  <Upload className="h-4 w-4 mr-2" />
                  Report {type === 'lost' ? 'Lost' : 'Found'} Item
                </>
              )}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}