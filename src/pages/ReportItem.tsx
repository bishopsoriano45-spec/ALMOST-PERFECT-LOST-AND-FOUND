import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import ImageUpload from '@/components/ImageUpload';
import DetectionResults from '@/components/DetectionResults';
import { ArrowLeft, Save, Loader2, AlertCircle, CheckCircle } from 'lucide-react';
import { itemService } from '@/services/itemService';
import { yoloService } from '@/services/yoloService';
import { DetectedObject, Item } from '@/types/item';
import { toast } from 'sonner';

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

export default function ReportItem() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [detectedObjects, setDetectedObjects] = useState<DetectedObject[]>([]);
  const [suggestedCategories, setSuggestedCategories] = useState<string[]>([]);
  
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: '',
    type: 'lost' as 'lost' | 'found',
    location: '',
    dateReported: new Date().toISOString().split('T')[0],
    contactName: '',
    contactEmail: '',
    contactPhone: '',
    images: [] as string[],
    tags: [] as string[]
  });

  const [currentTag, setCurrentTag] = useState('');

  const handleInputChange = (field: string, value: string | string[]) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleImagesChange = (images: string[]) => {
    setFormData(prev => ({ ...prev, images }));
  };

  const handleDetectionResults = (objects: DetectedObject[]) => {
    setDetectedObjects(objects);
    
    // Get suggested categories
    const suggestions = yoloService.getSuggestedCategories(objects);
    setSuggestedCategories(suggestions);
    
    // Auto-suggest tags from detected objects
    const objectTags = objects.map(obj => obj.class.replace('_', ' '));
    const uniqueTags = [...new Set([...formData.tags, ...objectTags])];
    setFormData(prev => ({ ...prev, tags: uniqueTags }));
    
    toast.success(`AI detected ${objects.length} objects in your image!`);
  };

  const addTag = () => {
    if (currentTag.trim() && !formData.tags.includes(currentTag.trim())) {
      setFormData(prev => ({
        ...prev,
        tags: [...prev.tags, currentTag.trim()]
      }));
      setCurrentTag('');
    }
  };

  const removeTag = (tagToRemove: string) => {
    setFormData(prev => ({
      ...prev,
      tags: prev.tags.filter(tag => tag !== tagToRemove)
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.title.trim() || !formData.description.trim() || !formData.contactEmail.trim()) {
      toast.error('Please fill in all required fields');
      return;
    }

    setLoading(true);
    
    try {
      const itemData: Omit<Item, 'id' | 'createdAt' | 'updatedAt'> = {
        title: formData.title.trim(),
        description: formData.description.trim(),
        category: formData.category || 'Other',
        type: formData.type,
        location: formData.location.trim(),
        dateReported: formData.dateReported,
        contactInfo: {
          name: formData.contactName.trim(),
          email: formData.contactEmail.trim(),
          phone: formData.contactPhone.trim() || undefined
        },
        images: formData.images,
        detectedObjects: detectedObjects.length > 0 ? detectedObjects : undefined,
        status: 'active',
        tags: formData.tags
      };

      const createdItem = await itemService.createItem(itemData);
      
      toast.success('Item reported successfully!');
      
      // Check for potential matches
      const matches = await itemService.getMatchingItems(createdItem);
      if (matches.length > 0) {
        toast.success(`Found ${matches.length} potential matches! Check your item details.`);
      }
      
      navigate(`/item/${createdItem.id}`);
    } catch (error) {
      console.error('Error creating item:', error);
      toast.error('Failed to report item. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center space-x-4 mb-8">
          <Button variant="ghost" onClick={() => navigate('/')}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Home
          </Button>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Report Item</h1>
            <p className="text-gray-600">Help us reunite lost items with their owners</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="max-w-4xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Main Form */}
            <div className="lg:col-span-2 space-y-6">
              {/* Basic Information */}
              <Card>
                <CardHeader>
                  <CardTitle>Basic Information</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Item Type */}
                  <div className="space-y-2">
                    <Label>Item Type *</Label>
                    <div className="flex space-x-4">
                      <Button
                        type="button"
                        variant={formData.type === 'lost' ? 'default' : 'outline'}
                        onClick={() => handleInputChange('type', 'lost')}
                        className="flex-1"
                      >
                        Lost Item
                      </Button>
                      <Button
                        type="button"
                        variant={formData.type === 'found' ? 'default' : 'outline'}
                        onClick={() => handleInputChange('type', 'found')}
                        className="flex-1"
                      >
                        Found Item
                      </Button>
                    </div>
                  </div>

                  {/* Title */}
                  <div className="space-y-2">
                    <Label htmlFor="title">Item Title *</Label>
                    <Input
                      id="title"
                      placeholder="e.g., Black leather backpack"
                      value={formData.title}
                      onChange={(e) => handleInputChange('title', e.target.value)}
                      required
                    />
                  </div>

                  {/* Description */}
                  <div className="space-y-2">
                    <Label htmlFor="description">Description *</Label>
                    <Textarea
                      id="description"
                      placeholder="Provide detailed description including distinctive features, contents, etc."
                      value={formData.description}
                      onChange={(e) => handleInputChange('description', e.target.value)}
                      rows={4}
                      required
                    />
                  </div>

                  {/* Category */}
                  <div className="space-y-2">
                    <Label>Category</Label>
                    <Select
                      value={formData.category}
                      onValueChange={(value) => handleInputChange('category', value)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select category" />
                      </SelectTrigger>
                      <SelectContent>
                        {CATEGORIES.map((category) => (
                          <SelectItem key={category} value={category}>
                            {category}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    
                    {/* Suggested Categories */}
                    {suggestedCategories.length > 0 && (
                      <div className="space-y-2">
                        <p className="text-sm text-gray-600">AI Suggestions:</p>
                        <div className="flex flex-wrap gap-2">
                          {suggestedCategories.map((category) => (
                            <Badge
                              key={category}
                              variant="secondary"
                              className="cursor-pointer hover:bg-blue-100"
                              onClick={() => handleInputChange('category', category)}
                            >
                              {category}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Location and Date */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="location">Location</Label>
                      <Input
                        id="location"
                        placeholder="Where was it lost/found?"
                        value={formData.location}
                        onChange={(e) => handleInputChange('location', e.target.value)}
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="dateReported">Date</Label>
                      <Input
                        id="dateReported"
                        type="date"
                        value={formData.dateReported}
                        onChange={(e) => handleInputChange('dateReported', e.target.value)}
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Images */}
              <Card>
                <CardHeader>
                  <CardTitle>Images</CardTitle>
                  <p className="text-sm text-gray-600">
                    Upload clear photos to help with AI detection and matching
                  </p>
                </CardHeader>
                <CardContent>
                  <ImageUpload
                    onImagesChange={handleImagesChange}
                    onDetectionResults={handleDetectionResults}
                    maxImages={5}
                  />
                </CardContent>
              </Card>

              {/* Tags */}
              <Card>
                <CardHeader>
                  <CardTitle>Tags</CardTitle>
                  <p className="text-sm text-gray-600">
                    Add keywords to help others find your item
                  </p>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex space-x-2">
                    <Input
                      placeholder="Add a tag..."
                      value={currentTag}
                      onChange={(e) => setCurrentTag(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addTag())}
                    />
                    <Button type="button" onClick={addTag}>
                      Add
                    </Button>
                  </div>
                  
                  {formData.tags.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                      {formData.tags.map((tag, index) => (
                        <Badge key={index} variant="secondary" className="flex items-center space-x-1">
                          <span>{tag}</span>
                          <button
                            type="button"
                            onClick={() => removeTag(tag)}
                            className="ml-1 hover:text-red-600"
                          >
                            ×
                          </button>
                        </Badge>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Contact Information */}
              <Card>
                <CardHeader>
                  <CardTitle>Contact Information</CardTitle>
                  <p className="text-sm text-gray-600">
                    This information will be shared with potential matches
                  </p>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="contactName">Your Name *</Label>
                    <Input
                      id="contactName"
                      placeholder="Enter your name"
                      value={formData.contactName}
                      onChange={(e) => handleInputChange('contactName', e.target.value)}
                      required
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="contactEmail">Email Address *</Label>
                    <Input
                      id="contactEmail"
                      type="email"
                      placeholder="your.email@example.com"
                      value={formData.contactEmail}
                      onChange={(e) => handleInputChange('contactEmail', e.target.value)}
                      required
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="contactPhone">Phone Number (Optional)</Label>
                    <Input
                      id="contactPhone"
                      type="tel"
                      placeholder="+1 (555) 123-4567"
                      value={formData.contactPhone}
                      onChange={(e) => handleInputChange('contactPhone', e.target.value)}
                    />
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              {/* AI Detection Results */}
              {detectedObjects.length > 0 && (
                <DetectionResults objects={detectedObjects} />
              )}

              {/* Submit Button */}
              <Card>
                <CardContent className="pt-6">
                  <Button
                    type="submit"
                    className="w-full"
                    size="lg"
                    disabled={loading}
                  >
                    {loading ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Reporting Item...
                      </>
                    ) : (
                      <>
                        <Save className="h-4 w-4 mr-2" />
                        Report Item
                      </>
                    )}
                  </Button>
                  
                  <p className="text-xs text-gray-500 mt-2 text-center">
                    By reporting this item, you agree to be contacted by potential matches
                  </p>
                </CardContent>
              </Card>

              {/* Tips */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm">Tips for Better Results</CardTitle>
                </CardHeader>
                <CardContent className="text-xs text-gray-600 space-y-2">
                  <div className="flex items-start space-x-2">
                    <CheckCircle className="h-3 w-3 text-green-600 mt-0.5 flex-shrink-0" />
                    <span>Upload clear, well-lit photos</span>
                  </div>
                  <div className="flex items-start space-x-2">
                    <CheckCircle className="h-3 w-3 text-green-600 mt-0.5 flex-shrink-0" />
                    <span>Include distinctive features in description</span>
                  </div>
                  <div className="flex items-start space-x-2">
                    <CheckCircle className="h-3 w-3 text-green-600 mt-0.5 flex-shrink-0" />
                    <span>Add relevant tags for better searchability</span>
                  </div>
                  <div className="flex items-start space-x-2">
                    <CheckCircle className="h-3 w-3 text-green-600 mt-0.5 flex-shrink-0" />
                    <span>Be specific about location and time</span>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}