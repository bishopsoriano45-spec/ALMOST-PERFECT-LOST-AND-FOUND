import { Item, Match, AIClassification, ChatbotResponse } from '@/types';

// Mock AI categories based on common lost items
const ITEM_CATEGORIES = [
  'phone', 'wallet', 'keys', 'bag', 'laptop', 'headphones', 
  'jewelry', 'clothing', 'books', 'umbrella', 'glasses', 'id_card'
];

// Mock AI service for object classification
export const classifyImage = async (imageUrl: string): Promise<AIClassification> => {
  // Simulate AI processing delay
  await new Promise(resolve => setTimeout(resolve, 1500));
  
  // Mock classification based on image name or random selection
  const category = ITEM_CATEGORIES[Math.floor(Math.random() * ITEM_CATEGORIES.length)];
  const confidence = 0.7 + Math.random() * 0.25; // 70-95% confidence
  
  const features = generateMockFeatures(category);
  
  return {
    category,
    confidence,
    features
  };
};

// Generate mock visual features for different categories
const generateMockFeatures = (category: string): string[] => {
  const featureMap: Record<string, string[]> = {
    phone: ['rectangular shape', 'screen', 'camera lens', 'charging port'],
    wallet: ['rectangular', 'leather texture', 'card slots', 'fold line'],
    keys: ['metallic', 'keyring', 'teeth pattern', 'small size'],
    bag: ['handles', 'zipper', 'fabric texture', 'compartments'],
    laptop: ['rectangular', 'screen', 'keyboard', 'ports'],
    headphones: ['circular ear cups', 'headband', 'wire/wireless', 'brand logo']
  };
  
  return featureMap[category] || ['generic object', 'color pattern', 'texture', 'shape'];
};

// Mock hybrid matching algorithm
export const findMatches = async (item: Item, allItems: Item[]): Promise<Match[]> => {
  await new Promise(resolve => setTimeout(resolve, 1000));
  
  const oppositeType = item.type === 'lost' ? 'found' : 'lost';
  const candidateItems = allItems.filter(i => 
    i.type === oppositeType && 
    i.status === 'active' &&
    i.id !== item.id
  );
  
  const matches: Match[] = [];
  
  for (const candidate of candidateItems) {
    const similarity = calculateSimilarity(item, candidate);
    
    if (similarity.score > 0.3) { // Threshold for potential matches
      matches.push({
        itemId: item.id,
        matchedItemId: candidate.id,
        similarityScore: similarity.score,
        matchType: similarity.type,
        confidence: similarity.confidence,
        explanation: similarity.explanation,
        timestamp: new Date().toISOString()
      });
    }
  }
  
  // Sort by similarity score descending
  return matches.sort((a, b) => b.similarityScore - a.similarityScore);
};

// Calculate similarity between two items
const calculateSimilarity = (item1: Item, item2: Item): {
  score: number;
  type: 'visual' | 'metadata' | 'hybrid';
  confidence: number;
  explanation: string[];
} => {
  const explanation: string[] = [];
  let totalScore = 0;
  let factors = 0;
  
  // Category matching (40% weight)
  if (item1.category === item2.category || 
      item1.aiClassification?.category === item2.aiClassification?.category) {
    totalScore += 0.4;
    explanation.push(`Same category: ${item1.category}`);
  }
  factors++;
  
  // Location proximity (20% weight)
  const locationScore = calculateLocationSimilarity(item1.location.name, item2.location.name);
  totalScore += locationScore * 0.2;
  if (locationScore > 0.5) {
    explanation.push(`Found in nearby location: ${item2.location.name}`);
  }
  factors++;
  
  // Text similarity (20% weight)
  const textScore = calculateTextSimilarity(
    `${item1.title} ${item1.description}`,
    `${item2.title} ${item2.description}`
  );
  totalScore += textScore * 0.2;
  if (textScore > 0.3) {
    explanation.push('Similar description keywords');
  }
  factors++;
  
  // Tags overlap (10% weight)
  const tagScore = calculateTagSimilarity(item1.tags, item2.tags);
  totalScore += tagScore * 0.1;
  if (tagScore > 0) {
    explanation.push('Matching tags found');
  }
  factors++;
  
  // Time relevance (10% weight)
  const timeScore = calculateTimeRelevance(item1.dateReported, item2.dateReported);
  totalScore += timeScore * 0.1;
  factors++;
  
  const finalScore = Math.min(totalScore, 0.95); // Cap at 95%
  const confidence = finalScore * (0.8 + Math.random() * 0.2); // Add some variance
  
  return {
    score: finalScore,
    type: 'hybrid',
    confidence,
    explanation
  };
};

const calculateLocationSimilarity = (loc1: string, loc2: string): number => {
  if (loc1.toLowerCase() === loc2.toLowerCase()) return 1.0;
  
  // Simple keyword matching for building/area names
  const words1 = loc1.toLowerCase().split(/\s+/);
  const words2 = loc2.toLowerCase().split(/\s+/);
  
  const commonWords = words1.filter(word => words2.includes(word));
  return commonWords.length / Math.max(words1.length, words2.length);
};

const calculateTextSimilarity = (text1: string, text2: string): number => {
  const words1 = text1.toLowerCase().split(/\s+/);
  const words2 = text2.toLowerCase().split(/\s+/);
  
  const commonWords = words1.filter(word => 
    word.length > 2 && words2.includes(word)
  );
  
  return commonWords.length / Math.max(words1.length, words2.length);
};

const calculateTagSimilarity = (tags1: string[], tags2: string[]): number => {
  if (tags1.length === 0 && tags2.length === 0) return 0;
  
  const commonTags = tags1.filter(tag => tags2.includes(tag));
  return commonTags.length / Math.max(tags1.length, tags2.length);
};

const calculateTimeRelevance = (date1: string, date2: string): number => {
  const diff = Math.abs(new Date(date1).getTime() - new Date(date2).getTime());
  const daysDiff = diff / (1000 * 60 * 60 * 24);
  
  // Higher score for items reported closer in time
  return Math.max(0, 1 - daysDiff / 30); // Decay over 30 days
};

// Mock chatbot responses
export const getChatbotResponse = async (message: string): Promise<ChatbotResponse> => {
  await new Promise(resolve => setTimeout(resolve, 800));
  
  const lowerMessage = message.toLowerCase();
  
  if (lowerMessage.includes('lost') || lowerMessage.includes('missing')) {
    return {
      response: "I'm sorry to hear you lost something! Can you tell me what type of item it is? For example: phone, wallet, keys, bag, etc.",
      suggestions: ['Phone', 'Wallet', 'Keys', 'Bag', 'Laptop']
    };
  }
  
  if (lowerMessage.includes('phone') || lowerMessage.includes('mobile')) {
    return {
      response: "Got it! Can you describe your phone? What brand, color, and any distinctive features like a case or screen protector?",
      suggestions: ['iPhone', 'Samsung', 'Black case', 'Cracked screen', 'Clear case']
    };
  }
  
  if (lowerMessage.includes('wallet')) {
    return {
      response: "I'll help you find your wallet! What color is it and what material? Leather, fabric, or something else?",
      suggestions: ['Black leather', 'Brown leather', 'Fabric', 'Small size', 'Large size']
    };
  }
  
  if (lowerMessage.includes('where') || lowerMessage.includes('location')) {
    return {
      response: "Where do you think you might have lost it? Try to be as specific as possible - building name, room number, or area.",
      suggestions: ['Library', 'Cafeteria', 'Classroom', 'Parking lot', 'Gym']
    };
  }
  
  return {
    response: "I'm here to help you describe your lost item! Try telling me what you lost and where you think you might have left it.",
    suggestions: ['I lost my phone', 'I found something', 'Where should I look?']
  };
};