# Lost & Found AI-Powered Webapp - MVP Implementation

## Core Files to Create:

### 1. Main Pages
- `src/pages/Index.tsx` - Dashboard with recent items and search
- `src/pages/ReportLost.tsx` - Report lost item form
- `src/pages/ReportFound.tsx` - Report found item form
- `src/pages/ItemDetail.tsx` - Individual item view with matching
- `src/pages/MyItems.tsx` - User's reported items

### 2. Core Components
- `src/components/ItemCard.tsx` - Display item cards with similarity scores
- `src/components/ImageUpload.tsx` - AI-powered image upload with preview
- `src/components/ChatBot.tsx` - Smart assistant for item description
- `src/components/LocationPicker.tsx` - Geo-tagging interface
- `src/components/MatchingResults.tsx` - AI matching display with confidence scores

### 3. Services & Utils
- `src/lib/aiService.ts` - Mock AI matching and classification
- `src/lib/storage.ts` - Local storage management
- `src/lib/notifications.ts` - Notification system
- `src/types/index.ts` - TypeScript interfaces

## Key Features Implementation:
1. ✅ Hybrid matching (image + metadata simulation)
2. ✅ Self-learning feedback system
3. ✅ Automated object classification
4. ✅ Smart chatbot assistant
5. ✅ Owner verification layer
6. ✅ Geo-tagging with campus map
7. ✅ Notification system
8. ✅ Visual similarity scoring
9. ✅ QR code generation
10. ✅ Privacy-aware design

## Tech Stack:
- React + TypeScript
- Shadcn/ui components
- Tailwind CSS
- Local storage for data persistence
- Mock AI services (production would use YOLOv8, CLIP, etc.)