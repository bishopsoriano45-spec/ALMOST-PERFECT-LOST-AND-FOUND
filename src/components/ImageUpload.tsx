import { useState, useCallback, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Upload, Camera, X, Loader2, CheckCircle, AlertCircle, Sparkles } from 'lucide-react';
import { classifyImage } from '@/lib/aiService';
import { AIClassification } from '@/types';

interface ImageUploadProps {
  onImageSelect: (imageUrl: string, classification?: AIClassification, file?: File) => void;
  onClassificationComplete?: (classification: AIClassification) => void;
  className?: string;
  previewUrl?: string | null; // Add previewUrl prop
}

export default function ImageUpload({ onImageSelect, onClassificationComplete, className, previewUrl }: ImageUploadProps) {
  const [dragActive, setDragActive] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [classifying, setClassifying] = useState(false);
  const [selectedImage, setSelectedImage] = useState<string | null>(previewUrl || null);
  const [classification, setClassification] = useState<AIClassification | null>(null);
  const [progress, setProgress] = useState(0);
  const [analysisStage, setAnalysisStage] = useState<string>('');

  // Sync state with prop
  useEffect(() => {
    if (previewUrl !== undefined) {
      setSelectedImage(previewUrl);
    }
  }, [previewUrl]);

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
      onImageSelect(imageUrl, undefined, file); // Notify parent immediately with file
      setProgress(100);
      setUploading(false);

      // Start enhanced AI classification with progress updates
      setClassifying(true);
      setAnalysisStage('Analyzing image...');

      // Simulate multi-stage analysis
      setTimeout(() => setAnalysisStage('Detecting colors and materials...'), 500);
      setTimeout(() => setAnalysisStage('Identifying shapes and features...'), 1000);
      setTimeout(() => setAnalysisStage('Recognizing brand and category...'), 1500);

      const aiResult = await classifyImage(imageUrl);

      setAnalysisStage('Classification complete!');
      setClassification(aiResult);
      setClassifying(false);

      onImageSelect(imageUrl, aiResult, file);
      onClassificationComplete?.(aiResult);
    } catch (error) {
      console.error('Upload failed:', error);
      setUploading(false);
      setClassifying(false);
      setAnalysisStage('');
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
    setAnalysisStage('');
  };

  return (
    <div className={className}>
      <Card className={`transition-colors duration-200 ${dragActive ? 'border-blue-500 bg-blue-50' : 'border-dashed border-gray-300'
        }`}>
        <CardContent className="p-6">
          {!selectedImage && !previewUrl ? (
            <div
              className="text-center space-y-4"
              onDragEnter={handleDrag}
              onDragLeave={handleDrag}
              onDragOver={handleDrag}
              onDrop={handleDrop}
            >
              <div className="mx-auto w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                {uploading ? (
                  <Loader2 className="h-8 w-8 animate-spin text-white" />
                ) : (
                  <Upload className="h-8 w-8 text-white" />
                )}
              </div>

              <div>
                <h3 className="font-medium text-gray-900 flex items-center justify-center gap-2">
                  <Sparkles className="h-4 w-4 text-purple-500" />
                  Upload Image for Enhanced AI Analysis
                </h3>
                <p className="text-sm text-gray-500 mt-1">
                  Our advanced AI will analyze colors, materials, shapes, brands, and unique features
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

              <div className="text-xs text-gray-400 mt-4">
                Supported formats: JPG, PNG, WEBP • Max size: 10MB
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="relative">
                <img
                  src={selectedImage || previewUrl || ''}
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
                <div className="space-y-3">
                  <div className="flex items-center gap-2 text-sm text-blue-600">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span className="font-medium">{analysisStage}</span>
                  </div>
                  <div className="bg-blue-50 p-3 rounded-lg">
                    <p className="text-xs text-blue-700">
                      🔍 Analyzing visual features with advanced computer vision...
                    </p>
                  </div>
                </div>
              )}

              {classification && (
                <div className="bg-gradient-to-br from-green-50 to-emerald-50 p-4 rounded-lg space-y-3 border border-green-200">
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-5 w-5 text-green-600" />
                    <span className="font-semibold text-green-800">Enhanced AI Analysis Complete</span>
                  </div>

                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-green-700">Detected Category:</span>
                      <Badge className="bg-green-600 text-white">
                        {classification.category.toUpperCase()}
                      </Badge>
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-green-700">Confidence Level:</span>
                      <div className="flex items-center gap-2">
                        <div className="w-24 bg-green-200 rounded-full h-2">
                          <div
                            className="bg-green-600 h-2 rounded-full transition-all duration-500"
                            style={{ width: `${classification.confidence * 100}%` }}
                          />
                        </div>
                        <span className="text-sm font-semibold text-green-600">
                          {Math.round(classification.confidence * 100)}%
                        </span>
                      </div>
                    </div>

                    <div>
                      <span className="text-sm font-medium text-green-700 block mb-2">
                        Detected Features ({classification.features.length}):
                      </span>
                      <div className="flex flex-wrap gap-1">
                        {classification.features.map((feature: string, index: number) => (
                          <Badge key={index} variant="outline" className="text-xs bg-white border-green-300 text-green-700">
                            {feature}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  </div>

                  {classification.confidence < 0.75 && (
                    <div className="flex items-start gap-2 text-amber-700 bg-amber-50 p-3 rounded border border-amber-200">
                      <AlertCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
                      <span className="text-xs">
                        Moderate confidence detection. Please verify the category and add detailed description for better matching accuracy.
                      </span>
                    </div>
                  )}

                  {classification.confidence >= 0.75 && (
                    <div className="flex items-start gap-2 text-green-700 bg-green-100 p-3 rounded">
                      <Sparkles className="h-4 w-4 mt-0.5 flex-shrink-0" />
                      <span className="text-xs font-medium">
                        High confidence match! Our AI has accurately identified your item's key features.
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