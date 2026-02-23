import { YOLOResponse, DetectedObject } from '@/types/item';

interface Detection {
  label?: string;
  predicted_class?: string;
  class?: string;
  confidence: number;
  bbox?: number[];
  cords?: number[];
}

// Mock YOLOv8m service - replace with actual API endpoint
class YOLOService {
  private mockObjects: string[] = [
    'person', 'bicycle', 'car', 'motorcycle', 'airplane', 'bus', 'train', 'truck',
    'boat', 'traffic light', 'fire hydrant', 'stop sign', 'parking meter', 'bench',
    'bird', 'cat', 'dog', 'horse', 'sheep', 'cow', 'elephant', 'bear', 'zebra',
    'giraffe', 'backpack', 'umbrella', 'handbag', 'tie', 'suitcase', 'frisbee',
    'skis', 'snowboard', 'sports ball', 'kite', 'baseball bat', 'baseball glove',
    'skateboard', 'surfboard', 'tennis racket', 'bottle', 'wine glass', 'cup',
    'fork', 'knife', 'spoon', 'bowl', 'banana', 'apple', 'sandwich', 'orange',
    'broccoli', 'carrot', 'hot dog', 'pizza', 'donut', 'cake', 'chair', 'couch',
    'potted plant', 'bed', 'dining table', 'toilet', 'tv', 'laptop', 'mouse',
    'remote', 'keyboard', 'cell phone', 'microwave', 'oven', 'toaster', 'sink',
    'refrigerator', 'book', 'clock', 'vase', 'scissors', 'teddy bear', 'hair drier',
    'toothbrush'
  ];

  async detectObjects(imageFile: File): Promise<YOLOResponse> {
    const formData = new FormData();
    formData.append('image', imageFile);

    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL || '/api'}/ai/detect`, {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error('Failed to detect objects');
      }

      const data = await response.json();

      // Map the Python API response to the Expected Interface
      // Python returns: { filename, detections: [{ bbox: [], predicted_class: "", confidence: 0.0 }] }
      // Frontend expects: { objects: [{ class: "", confidence: 0.0, bbox: {x,y,width,height} }], ... }

      const rawDetections = data.detections || [];
      const objects: DetectedObject[] = rawDetections.map((det: Detection) => {
        const className = det.label || det.predicted_class || det.class || 'unknown';
        const box = det.bbox || det.cords || [0, 0, 0, 0];
        return {
          class: className,
          confidence: det.confidence,
          bbox: {
            x: box[0],
            y: box[1],
            width: box[2] - box[0],
            height: box[3] - box[1]
          }
        };
      });

      return {
        objects: objects.sort((a, b) => b.confidence - a.confidence),
        processingTime: 0,
        imageSize: { width: 0, height: 0 }
      };
    } catch (error) {
      console.error('YOLO Service Error:', error);
      return {
        objects: [],
        processingTime: 0,
        imageSize: { width: 0, height: 0 }
      };
    }
  }

  // Get suggested categories based on detected objects
  getSuggestedCategories(objects: DetectedObject[]): string[] {
    const categoryMap: { [key: string]: string } = {
      'backpack': 'Bags & Accessories',
      'handbag': 'Bags & Accessories',
      'suitcase': 'Bags & Accessories',
      'laptop': 'Electronics',
      'cell phone': 'Electronics',
      'tablet': 'Electronics',
      'camera': 'Electronics',
      'book': 'Personal Items',
      'umbrella': 'Personal Items',
      'sunglasses': 'Personal Items',
      'watch': 'Jewelry & Accessories',
      'tie': 'Clothing',
      'shoe': 'Clothing',
      'bicycle': 'Sports & Recreation',
      'skateboard': 'Sports & Recreation',
      'sports ball': 'Sports & Recreation',
      'wallet': 'Personal Items',
      // Electronics Model Classes
      'calculator': 'Electronics',
      'earphone': 'Electronics',
      'joy stick': 'Electronics',
      'laptop_computer': 'Electronics',
      'mouse': 'Electronics',
      'printer': 'Electronics',

      'remote': 'Electronics',
      'smart phone': 'Electronics'
    };

    const categories = new Set<string>();
    objects.forEach(obj => {
      const cls = obj.class ? obj.class.toLowerCase() : '';
      const category = categoryMap[cls];
      if (category) {
        categories.add(category);
      }
    });

    return Array.from(categories);
  }
}

export const yoloService = new YOLOService();