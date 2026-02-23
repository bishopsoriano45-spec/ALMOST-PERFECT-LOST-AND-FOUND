import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Eye, Zap, Target } from 'lucide-react';
import { DetectedObject } from '@/types/item';

interface DetectionResultsProps {
  objects: DetectedObject[];
  isLoading?: boolean;
  className?: string;
}

export default function DetectionResults({ 
  objects, 
  isLoading = false, 
  className = '' 
}: DetectionResultsProps) {
  if (isLoading) {
    return (
      <Card className={`animate-pulse ${className}`}>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Zap className="h-5 w-5 text-blue-600" />
            <span>AI Detection in Progress...</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex items-center space-x-3">
                <div className="h-4 bg-gray-200 rounded w-20"></div>
                <div className="h-4 bg-gray-200 rounded flex-1"></div>
                <div className="h-4 bg-gray-200 rounded w-16"></div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (objects.length === 0) {
    return null;
  }

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 0.8) return 'bg-green-500';
    if (confidence >= 0.6) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  const getConfidenceLabel = (confidence: number) => {
    if (confidence >= 0.8) return 'High';
    if (confidence >= 0.6) return 'Medium';
    return 'Low';
  };

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <Eye className="h-5 w-5 text-blue-600" />
          <span>AI Detection Results</span>
          <Badge variant="secondary" className="ml-auto">
            {objects.length} object{objects.length !== 1 ? 's' : ''} detected
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {objects.map((object, index) => (
            <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div className="flex items-center space-x-3">
                <div className="flex items-center space-x-2">
                  <Target className="h-4 w-4 text-gray-600" />
                  <span className="font-medium capitalize">
                    {object.class.replace('_', ' ')}
                  </span>
                </div>
              </div>
              
              <div className="flex items-center space-x-3">
                <div className="flex items-center space-x-2">
                  <Progress 
                    value={object.confidence * 100} 
                    className="w-20 h-2"
                  />
                  <span className="text-sm font-medium">
                    {Math.round(object.confidence * 100)}%
                  </span>
                </div>
                
                <Badge 
                  variant="secondary"
                  className={`text-white ${getConfidenceColor(object.confidence)}`}
                >
                  {getConfidenceLabel(object.confidence)}
                </Badge>
              </div>
            </div>
          ))}
        </div>
        
        {/* Detection Info */}
        <div className="mt-4 p-3 bg-blue-50 rounded-lg">
          <div className="flex items-center space-x-2 text-sm text-blue-800">
            <Zap className="h-4 w-4" />
            <span>
              These detected objects will help match your item with others in the system
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}