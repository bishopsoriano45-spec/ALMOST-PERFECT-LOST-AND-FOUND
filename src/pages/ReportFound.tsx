import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue, SelectGroup, SelectLabel } from '@/components/ui/select';
import { ArrowLeft, MapPin, Phone, Mail, User, Lock, LogOut } from 'lucide-react';
import { Link } from 'react-router-dom';
import ImageUpload from '@/components/ImageUpload';
import ChatBot from '@/components/ChatBot';
import { Item, AIClassification } from '@/types';
import { useAuth } from '@/context/AuthContext';
import { toast } from 'sonner';

const CATEGORIES = {
  "Electronics": [
    { value: "mobile_phone", label: "Mobile Phone" },
    { value: "laptop", label: "Laptop" },
    { value: "tablet", label: "Tablet" },
    { value: "headphones", label: "Headphones / Earbuds" },
    { value: "camera", label: "Camera" },
    { value: "smart_watch", label: "Smart Watch" },
    { value: "charger", label: "Charger / Cable" }
  ],
  "Personal Accessories": [
    { value: "wallet", label: "Wallet / Purse" },
    { value: "bag", label: "Bag / Backpack" },
    { value: "keys", label: "Keys" },
    { value: "glasses", label: "Glasses / Sunglasses" },
    { value: "jewelry", label: "Jewelry" },
    { value: "watch", label: "Watch (Analog/Digital)" }
  ],
  "Clothing": [
    { value: "upper_wear", label: "Upper Wear (Shirt, Jacket, etc.)" },
    { value: "lower_wear", label: "Lower Wear (Pants, Skirt, etc.)" },
    { value: "footwear", label: "Footwear" },
    { value: "headwear", label: "Headwear (Hat, Cap)" }
  ],
  "Documents": [
    { value: "id_card", label: "ID Card / Driver's License" },
    { value: "passport", label: "Passport" },
    { value: "student_id", label: "Student ID" },
    { value: "credit_card", label: "Credit / Debit Card" }
  ],
  "Academic": [
    { value: "book", label: "Book / Notebook" },
    { value: "stationery", label: "Stationery" }
  ],
  "Other": [
    { value: "umbrella", label: "Umbrella" },
    { value: "water_bottle", label: "Water Bottle" },
    { value: "medical", label: "Medical Items" },
    { value: "sports", label: "Sports Equipment" },
    { value: "other", label: "Other" }
  ]
};

const CATEGORY_MAPPING: Record<string, string> = {
  'phone': 'mobile_phone',
  'smart phone': 'mobile_phone',
  'cell phone': 'mobile_phone',
  'wallet': 'wallet',
  'keys': 'keys',
  'bag': 'bag',
  'backpack': 'bag',
  'laptop': 'laptop',
  'computer': 'laptop',
  'headphones': 'headphones',
  'earphones': 'headphones',
  'jewelry': 'jewelry',
  'clothing': 'upper_wear', // Default assumption
  'books': 'book',
  'umbrella': 'umbrella',
  'glasses': 'glasses',
  'sunglasses': 'glasses',
  'id_card': 'id_card',
  'watch': 'watch'
};

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

export default function ReportFound() {
  const navigate = useNavigate();
  const { user, isAuthenticated, isLoading, logout } = useAuth();
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: '',
    location: '',
    contactName: user?.name || '',
    contactEmail: user?.email || '',
    contactPhone: '',
    tags: ''
  });
  const [imageUrl, setImageUrl] = useState<string>('');
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [aiClassification, setAiClassification] = useState<AIClassification | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      // Redirect to login or show modal
      toast.error('You must be logged in to report a found item');
      navigate('/login?redirect=/report-found');
    }
  }, [isAuthenticated, isLoading, navigate]);

  if (isLoading) {
    return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
  }

  if (!isAuthenticated) {
    return null; // Will redirect
  }

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleChatSuggestion = (suggestion: string) => {
    const lower = suggestion.toLowerCase();

    // Auto-fill category based on suggestion
    for (const [key, value] of Object.entries(CATEGORY_MAPPING)) {
      if (lower.includes(key)) {
        setFormData(prev => ({ ...prev, category: value }));
        break;
      }
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
      const mappedCategory = CATEGORY_MAPPING[classification.category.toLowerCase()] || classification.category;
      // Check if mapped category exists in our grouped options (simple validation)
      let isValidCategory = false;
      Object.values(CATEGORIES).forEach(group => {
        if (group.some(item => item.value === mappedCategory)) isValidCategory = true;
      });

      if (isValidCategory) {
        setFormData(prev => ({ ...prev, category: mappedCategory }));
      } else {
        // Fallback or keep as is if it matches a valid value directly
        // check if the raw classification is a valid value
        let isRawValid = false;
        Object.values(CATEGORIES).forEach(group => {
          if (group.some(item => item.value === classification.category)) isRawValid = true;
        });

        if (isRawValid) {
          setFormData(prev => ({ ...prev, category: classification.category }));
        }
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const finalLocation = formData.location;
      const tags = formData.tags.split(',').map(tag => tag.trim()).filter(Boolean);

      // Prepare FormData for backend
      const formDataToSend = new FormData();
      formDataToSend.append('title', formData.title);
      formDataToSend.append('description', formData.description);
      formDataToSend.append('category', formData.category);
      formDataToSend.append('location', finalLocation);
      formDataToSend.append('date_found', new Date().toISOString());
      // The backend returns user_id, but the frontend interface says id. Check both, fallback to 'guest'.
      // DO NOT use email as a fallback, it violates the foreign key constraint on the database.
      formDataToSend.append('user_id', user?.id || (user as any)?.user_id || 'guest');
      formDataToSend.append('contact_email', formData.contactEmail);
      formDataToSend.append('contact_phone', formData.contactPhone);
      formDataToSend.append('tags', JSON.stringify(tags));

      // Add AI metadata if available
      if (aiClassification) {
        formDataToSend.append('ai_metadata', JSON.stringify(aiClassification));
        // Explicitly append embedding if available
        if (aiClassification.embedding) {
          formDataToSend.append('embedding', JSON.stringify(aiClassification.embedding));
        }
      }

      // Add image if uploaded
      if (uploadedFile) {
        formDataToSend.append('image', uploadedFile);
      }

      // Call backend API
      const apiResponse = await fetch(`${import.meta.env.VITE_API_URL || '/api'}/items/found`, {
        method: 'POST',
        body: formDataToSend,
      });

      if (!apiResponse.ok) {
        const errorText = await apiResponse.text();
        console.error('API Error Response:', errorText);
        throw new Error(`Failed to create item: ${apiResponse.status} - ${errorText}`);
      }

      const createdItem = await apiResponse.json();

      toast.success('Found item reported successfully!');
      navigate(`/item/${createdItem.id}?success=true`);
    } catch (error) {
      console.error('Error saving item:', error);
      toast.error('Failed to report item. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const isFormValid = formData.title && formData.description && formData.category &&
    formData.location &&
    formData.contactName && formData.contactEmail;

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center h-16">
            <Button variant="ghost" size="sm" asChild>
              <Link to="/">
                <ArrowLeft className="h-4 w-4 sm:mr-2" />
                <span className="hidden sm:inline">Back to Home</span>
              </Link>
            </Button>
            <h1 className="ml-2 sm:ml-4 text-base sm:text-xl font-semibold text-gray-900">Report Found Item</h1>
            {isAuthenticated && (
              <Button variant="outline" size="sm" onClick={() => { logout(); navigate('/'); }} className="ml-auto text-red-600 border-red-200 hover:bg-red-50 hover:text-red-700">
                <LogOut className="h-4 w-4 sm:mr-2" />
                <span className="hidden sm:inline">Logout</span>
              </Button>
            )}
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Form */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle>Found Item Details</CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-6">
                  {/* Image Upload */}
                  <div>
                    <Label className="text-base font-medium">Item Photo (Highly Recommended)</Label>
                    <p className="text-sm text-gray-500 mb-3">
                      Upload a clear photo to help owners identify their item. Our AI will analyze it automatically.
                    </p>
                    <ImageUpload
                      onImageSelect={(url, _, file) => {
                        setImageUrl(url);
                        if (file) {
                          setUploadedFile(file);
                        }
                      }}
                      onClassificationComplete={handleImageClassification}
                      previewUrl={imageUrl}
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
                        placeholder="e.g., iPhone with Clear Case"
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
                          {Object.entries(CATEGORIES).map(([groupName, items]) => (
                            <SelectGroup key={groupName}>
                              <SelectLabel>{groupName}</SelectLabel>
                              {items.map((item) => (
                                <SelectItem key={item.value} value={item.value}>
                                  {item.label}
                                </SelectItem>
                              ))}
                            </SelectGroup>
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
                      placeholder="Describe the found item: color, brand, condition, any distinctive features you noticed..."
                      rows={4}
                      required
                    />
                  </div>

                  {/* Location */}
                  <div>
                    <Label htmlFor="location">Where You Found It *</Label>
                    <Input
                      id="location"
                      value={formData.location}
                      onChange={(e) => handleInputChange('location', e.target.value)}
                      placeholder="e.g., Library 2nd Floor"
                      required
                    />
                  </div>

                  <div>
                    <Label htmlFor="tags">Tags (Optional)</Label>
                    <Input
                      id="tags"
                      value={formData.tags}
                      onChange={(e) => handleInputChange('tags', e.target.value)}
                      placeholder="e.g., damaged, new condition, has stickers (separate with commas)"
                    />
                  </div>

                  {/* Contact Information */}
                  <div className="space-y-4">
                    <h3 className="text-lg font-medium">Your Contact Information</h3>
                    <p className="text-sm text-gray-600">
                      This will be shared with the item owner when they want to claim it.
                    </p>

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

                  <Button
                    type="submit"
                    className="w-full"
                    disabled={!isFormValid || isSubmitting}
                  >
                    {isSubmitting ? 'Submitting...' : 'Report Found Item'}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </div>

          {/* AI Assistant Sidebar */}
          <div>
            <ChatBot
              className="h-full border-none shadow-none"
              onSuggestionApply={handleChatSuggestion}
              onInfoExtracted={(info) => {
                if (info.category) {
                  const mappedCategory = CATEGORY_MAPPING[info.category.toLowerCase()] || info.category.toLowerCase();
                  setFormData(prev => ({ ...prev, category: mappedCategory }));
                }
                if (info.description) {
                  setFormData(prev => ({ ...prev, description: info.description }));
                }
                if (info.location) {
                  setFormData(prev => ({ ...prev, location: info.location }));
                }
              }}
            />
          </div>
        </div>
      </main>
    </div>
  );
}