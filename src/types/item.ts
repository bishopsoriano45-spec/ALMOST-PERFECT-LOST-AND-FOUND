export interface DetectedObject {
  class: string;
  confidence: number;
  bbox: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
}

export interface YOLOResponse {
  objects: DetectedObject[];
  processingTime: number;
  imageSize: {
    width: number;
    height: number;
  };
}

export interface AIClassification {
  category: string;
  subcategory?: string;
  confidence: number;
  features: string[];
  description?: string;
  brand?: string | null;
  color?: string | null;
  alternatives?: { category: string; confidence: number }[];
  processingTime?: number;
  embedding?: number[];
}

export interface Item {
  id: string;
  title: string;
  description: string;
  category: string;
  type: 'lost' | 'found';
  location: {
    name: string;
    coordinates?: { lat: number; lng: number };
  };
  dateReported: string;
  contactInfo: {
    name: string;
    email: string;
    phone?: string;
  };
  imageUrl?: string;
  detectedObjects?: DetectedObject[];
  status: 'open' | 'active' | 'resolved' | 'archived' | 'matched' | 'claimed';
  tags: string[];
  createdAt: string;
  updatedAt: string;
  verificationRequired?: boolean;
  embedding?: number[];
  confidenceScore?: number;
  aiClassification?: AIClassification;
  qrCode?: string;
}

export interface SearchFilters {
  type?: 'lost' | 'found' | 'all';
  category?: string;
  location?: string;
  dateRange?: {
    start: string;
    end: string;
  };
  status?: 'active' | 'resolved' | 'expired' | 'all';
  searchQuery?: string;
}