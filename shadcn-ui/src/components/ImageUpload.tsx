import { useState, useCallback } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Upload, Camera, X, Loader2, CheckCircle, AlertCircle } from 'lucide-react';
import { classifyImage } from '@/lib/aiService';
import { AIClassification } from '@/types';

interface ImageUploadProps {
  onImageSelect: (imageUrl: string, classification?: AIClassification) => void;
  onClassificationComplete?: (classification: AIClassification) => void;
  className?: string;
}

export default function ImageUpload({ onImageSelect, onClassificationComplete, className }: ImageUploadProps) {
  const [dragActive, setDragActive] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [classifying, setClassifying] = useState(false);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [classification, setClassification] = useState<AIClassification | null>(null);
  const [progress, setProgress] = useState(0);

  const handleFiles = useCallback(async (files: FileList) => {
    const file = files[0];
    if (!file || !file.type.startsWith('image/')) return;

    setUploading(true);
    setProgress(0);

    // Simulate upload progress
    const progressInterval = setInterval(() => {
      setProgress(prev => {
        if (prev >= 90) {
          clearInterval(progressInterval);
          return 90;
        }
        return prev + 10;
      });
    }, 100);

    try {
      // Create object URL for preview
      const imageUrl = URL.createObjectURL(file);
      setSelectedImage(imageUrl);
      setProgress(100);
      setUploading(false);

      // Start AI classification
      setClassifying(true);
      const aiResult = await classifyImage(imageUrl);
      setClassification(aiResult);
      setClassifying(false);

      onImageSelect(imageUrl, aiResult);
      onClassificationComplete?.(aiResult);
    } catch (error) {
      console.error('Upload failed:', error);
      setUploading(false);
      setClassifying(false);
    }
  }, [onImageSelect, onClassificationComplete]);

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFiles(e.dataTransfer.files);
    }
  }, [handleFiles]);

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleFiles(e.target.files);
    }
  };

  const clearImage = () => {
    setSelectedImage(null);
    setClassification(null);
    setProgress(0);
  };

  return (
    <div className={className}>
      <Card className={`transition-colors duration-200 ${
        dragActive ? 'border-blue-500 bg-blue-50' : 'border-dashed border-gray-300'
      }`}>
        <CardContent className="p-6">
          {!selectedImage ? (
            <div
              className="text-center space-y-4"
              onDragEnter={handleDrag}
              onDragLeave={handleDrag}
              onDragOver={handleDrag}
              onDrop={handleDrop}
            >
              <div className="mx-auto w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center">
                {uploading ? (
                  <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
                ) : (
                  <Upload className="h-8 w-8 text-gray-400" />
                )}
              </div>
              
              <div>
                <h3 className="font-medium text-gray-900">Upload an image</h3>
                <p className="text-sm text-gray-500 mt-1">
                  Drag and drop your image here, or click to browse
                </p>
              </div>

              {uploading && (
                <div className="space-y-2">
                  <Progress value={progress} className="w-full" />
                  <p className="text-sm text-gray-500">Uploading... {progress}%</p>
                </div>
              )}

              <div className="flex gap-2 justify-center">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => document.getElementById('file-upload')?.click()}
                  disabled={uploading}
                >
                  <Camera className="h-4 w-4 mr-2" />
                  Choose File
                </Button>
              </div>

              <input
                id="file-upload"
                type="file"
                accept="image/*"
                onChange={handleFileInput}
                className="hidden"
              />
            </div>
          ) : (
            <div className="space-y-4">
              <div className="relative">
                <img
                  src={selectedImage}
                  alt="Uploaded item"
                  className="w-full h-48 object-cover rounded-lg"
                />
                <Button
                  variant="destructive"
                  size="sm"
                  className="absolute top-2 right-2"
                  onClick={clearImage}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>

              {classifying && (
                <div className="flex items-center gap-2 text-sm text-blue-600">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  AI is analyzing your image...
                </div>
              )}

              {classification && (
                <div className="bg-green-50 p-4 rounded-lg space-y-3">
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-5 w-5 text-green-600" />
                    <span className="font-medium text-green-800">AI Classification Complete</span>
                  </div>
                  
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-green-700">Detected Category:</span>
                      <Badge className="bg-green-100 text-green-800">
                        {classification.category}
                      </Badge>
                      <span className="text-sm text-green-600">
                        ({Math.round(classification.confidence * 100)}% confidence)
                      </span>
                    </div>
                    
                    <div>
                      <span className="text-sm text-green-700">Detected Features:</span>
                      <div className="flex flex-wrap gap-1 mt-1">
                        {classification.features.map((feature: string, index: number) => (
                          <Badge key={index} variant="outline" className="text-xs">
                            {feature}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  </div>

                  {classification.confidence < 0.8 && (
                    <div className="flex items-center gap-2 text-amber-700 bg-amber-50 p-2 rounded">
                      <AlertCircle className="h-4 w-4" />
                      <span className="text-xs">
                        Low confidence detection. Please verify the category manually.
                      </span>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}