import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { ArrowLeft, MapPin, Phone, Mail, User } from 'lucide-react';
import { Link } from 'react-router-dom';
import ImageUpload from '@/components/ImageUpload';
import ChatBot from '@/components/ChatBot';
import { saveItem, generateQRCode } from '@/lib/storage';
import { Item, AIClassification } from '@/types';

const CATEGORIES = [
  'phone', 'wallet', 'keys', 'bag', 'laptop', 'headphones',
  'jewelry', 'clothing', 'books', 'umbrella', 'glasses', 'id_card', 'other'
];

const LOCATIONS = [
  'Library - Main Floor',
  'Library - 2nd Floor',
  'Library - Study Rooms',
  'Student Center - Cafeteria',
  'Student Center - Lounge',
  'Classroom Building A',
  'Classroom Building B',
  'Gymnasium',
  'Parking Lot A',
  'Parking Lot B',
  'Dormitory - Common Area',
  'Other'
];

export default function ReportLost() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: '',
    location: '',
    customLocation: '',
    contactName: '',
    contactEmail: '',
    contactPhone: '',
    tags: '',
    verificationRequired: true
  });
  const [imageUrl, setImageUrl] = useState<string>('');
  const [aiClassification, setAiClassification] = useState<AIClassification | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleInputChange = (field: string, value: string | boolean) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleChatSuggestion = (suggestion: string) => {
    const lower = suggestion.toLowerCase();
    
    // Auto-fill category based on suggestion
    if (lower.includes('phone')) {
      setFormData(prev => ({ ...prev, category: 'phone' }));
    } else if (lower.includes('wallet')) {
      setFormData(prev => ({ ...prev, category: 'wallet' }));
    } else if (lower.includes('keys')) {
      setFormData(prev => ({ ...prev, category: 'keys' }));
    } else if (lower.includes('bag')) {
      setFormData(prev => ({ ...prev, category: 'bag' }));
    }
    
    // Auto-fill description if it's empty
    if (!formData.description && suggestion.length > 10) {
      setFormData(prev => ({ ...prev, description: suggestion }));
    }
  };

  const handleImageClassification = (classification: AIClassification) => {
    setAiClassification(classification);
    // Auto-fill category if not already set
    if (!formData.category && classification.category) {
      setFormData(prev => ({ ...prev, category: classification.category }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const finalLocation = formData.location === 'Other' ? formData.customLocation : formData.location;
      const tags = formData.tags.split(',').map(tag => tag.trim()).filter(Boolean);
      
      const newItem: Item = {
        id: 'item_' + Date.now(),
        type: 'lost',
        title: formData.title,
        description: formData.description,
        category: formData.category,
        imageUrl: imageUrl || undefined,
        location: { name: finalLocation },
        dateReported: new Date().toISOString(),
        contactInfo: {
          name: formData.contactName,
          email: formData.contactEmail,
          phone: formData.contactPhone || undefined
        },
        status: 'active',
        tags,
        aiClassification: aiClassification || undefined,
        verificationRequired: formData.verificationRequired,
        qrCode: generateQRCode('item_' + Date.now())
      };

      saveItem(newItem);
      navigate(`/item/${newItem.id}?success=true`);
    } catch (error) {
      console.error('Error saving item:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const isFormValid = formData.title && formData.description && formData.category && 
                     (formData.location !== 'Other' ? formData.location : formData.customLocation) &&
                     formData.contactName && formData.contactEmail;

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center h-16">
            <Button variant="ghost" size="sm" asChild>
              <Link to="/">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Home
              </Link>
            </Button>
            <h1 className="ml-4 text-xl font-semibold text-gray-900">Report Lost Item</h1>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Form */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle>Lost Item Details</CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-6">
                  {/* Image Upload */}
                  <div>
                    <Label className="text-base font-medium">Item Photo (Optional but Recommended)</Label>
                    <p className="text-sm text-gray-500 mb-3">
                      Upload a photo for AI-powered matching. Our system will automatically analyze the image.
                    </p>
                    <ImageUpload
                      onImageSelect={setImageUrl}
                      onClassificationComplete={handleImageClassification}
                    />
                  </div>

                  {/* Basic Information */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="title">Item Title *</Label>
                      <Input
                        id="title"
                        value={formData.title}
                        onChange={(e) => handleInputChange('title', e.target.value)}
                        placeholder="e.g., Black iPhone 14"
                        required
                      />
                    </div>
                    
                    <div>
                      <Label htmlFor="category">Category *</Label>
                      <Select value={formData.category} onValueChange={(value) => handleInputChange('category', value)}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select category" />
                        </SelectTrigger>
                        <SelectContent>
                          {CATEGORIES.map((category) => (
                            <SelectItem key={category} value={category}>
                              {category.charAt(0).toUpperCase() + category.slice(1).replace('_', ' ')}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="description">Detailed Description *</Label>
                    <Textarea
                      id="description"
                      value={formData.description}
                      onChange={(e) => handleInputChange('description', e.target.value)}
                      placeholder="Describe your item in detail: color, brand, size, distinctive features, condition, etc."
                      rows={4}
                      required
                    />
                  </div>

                  {/* Location */}
                  <div>
                    <Label htmlFor="location">Last Known Location *</Label>
                    <Select value={formData.location} onValueChange={(value) => handleInputChange('location', value)}>
                      <SelectTrigger>
                        <SelectValue placeholder="Where did you last see it?" />
                      </SelectTrigger>
                      <SelectContent>
                        {LOCATIONS.map((location) => (
                          <SelectItem key={location} value={location}>
                            <div className="flex items-center gap-2">
                              <MapPin className="h-4 w-4" />
                              {location}
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    
                    {formData.location === 'Other' && (
                      <Input
                        className="mt-2"
                        value={formData.customLocation}
                        onChange={(e) => handleInputChange('customLocation', e.target.value)}
                        placeholder="Please specify the location"
                        required
                      />
                    )}
                  </div>

                  <div>
                    <Label htmlFor="tags">Tags (Optional)</Label>
                    <Input
                      id="tags"
                      value={formData.tags}
                      onChange={(e) => handleInputChange('tags', e.target.value)}
                      placeholder="e.g., cracked screen, blue case, small scratch (separate with commas)"
                    />
                  </div>

                  {/* Contact Information */}
                  <div className="space-y-4">
                    <h3 className="text-lg font-medium">Contact Information</h3>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="contactName">Your Name *</Label>
                        <div className="relative">
                          <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                          <Input
                            id="contactName"
                            value={formData.contactName}
                            onChange={(e) => handleInputChange('contactName', e.target.value)}
                            placeholder="Full name"
                            className="pl-10"
                            required
                          />
                        </div>
                      </div>
                      
                      <div>
                        <Label htmlFor="contactEmail">Email Address *</Label>
                        <div className="relative">
                          <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                          <Input
                            id="contactEmail"
                            type="email"
                            value={formData.contactEmail}
                            onChange={(e) => handleInputChange('contactEmail', e.target.value)}
                            placeholder="your.email@example.com"
                            className="pl-10"
                            required
                          />
                        </div>
                      </div>
                    </div>
                    
                    <div>
                      <Label htmlFor="contactPhone">Phone Number (Optional)</Label>
                      <div className="relative">
                        <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                        <Input
                          id="contactPhone"
                          type="tel"
                          value={formData.contactPhone}
                          onChange={(e) => handleInputChange('contactPhone', e.target.value)}
                          placeholder="+1 (555) 123-4567"
                          className="pl-10"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Verification */}
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="verification"
                      checked={formData.verificationRequired}
                      onCheckedChange={(checked) => handleInputChange('verificationRequired', checked as boolean)}
                    />
                    <Label htmlFor="verification" className="text-sm">
                      Require verification before claiming (recommended for valuable items)
                    </Label>
                  </div>

                  <Button 
                    type="submit" 
                    className="w-full" 
                    disabled={!isFormValid || isSubmitting}
                  >
                    {isSubmitting ? 'Submitting...' : 'Report Lost Item'}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </div>

          {/* AI Assistant Sidebar */}
          <div>
            <ChatBot onSuggestionApply={handleChatSuggestion} />
          </div>
        </div>
      </main>
    </div>
  );
}