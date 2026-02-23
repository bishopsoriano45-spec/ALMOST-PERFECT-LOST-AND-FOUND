import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { 
  Download, 
  Github, 
  Heart, 
  Zap, 
  Code,
  Server,
  Globe
} from 'lucide-react';

export default function Footer() {
  const handleDownloadSource = () => {
    const link = document.createElement('a');
    link.href = '/lost-found-ai-system.tar.gz';
    link.download = 'lost-found-ai-system.tar.gz';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <footer className="bg-gradient-to-r from-gray-900 to-gray-800 text-white">
      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Brand Section */}
          <div className="md:col-span-1">
            <div className="flex items-center space-x-2 mb-4">
              <Zap className="h-6 w-6 text-yellow-400" />
              <h3 className="text-xl font-bold">Lost & Found AI</h3>
            </div>
            <p className="text-gray-300 text-sm mb-4">
              AI-powered lost and found system using YOLOv8m object detection for smarter item matching.
            </p>
            <div className="flex flex-wrap gap-2">
              <Badge variant="secondary" className="bg-blue-100 text-blue-800">
                React + TypeScript
              </Badge>
              <Badge variant="secondary" className="bg-purple-100 text-purple-800">
                YOLOv8m AI
              </Badge>
              <Badge variant="secondary" className="bg-green-100 text-green-800">
                shadcn/ui
              </Badge>
            </div>
          </div>

          {/* Features */}
          <div>
            <h4 className="font-semibold mb-4">Features</h4>
            <ul className="space-y-2 text-sm text-gray-300">
              <li>🤖 AI Object Detection</li>
              <li>🔍 Smart Item Matching</li>
              <li>📱 Responsive Design</li>
              <li>📊 Admin Dashboard</li>
              <li>🎨 Modern UI/UX</li>
              <li>💾 Local Storage</li>
            </ul>
          </div>

          {/* Technology Stack */}
          <div>
            <h4 className="font-semibold mb-4">Tech Stack</h4>
            <ul className="space-y-2 text-sm text-gray-300">
              <li>• React 18 + TypeScript</li>
              <li>• Vite Build Tool</li>
              <li>• Tailwind CSS</li>
              <li>• shadcn/ui Components</li>
              <li>• YOLOv8m Integration</li>
              <li>• React Router</li>
            </ul>
          </div>

          {/* Deploy Your Own */}
          <div>
            <h4 className="font-semibold mb-4">Deploy Your Own</h4>
            <p className="text-sm text-gray-300 mb-4">
              Download the complete source code and deploy on your own server.
            </p>
            
            <Card className="bg-gray-800 border-gray-700">
              <CardContent className="p-4">
                <Button 
                  onClick={handleDownloadSource}
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white mb-3"
                  size="sm"
                >
                  <Download className="h-4 w-4 mr-2" />
                  Download Source Code
                </Button>
                
                <div className="text-xs text-gray-400 space-y-1">
                  <div className="flex items-center space-x-1">
                    <Code className="h-3 w-3" />
                    <span>Complete source code</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <Server className="h-3 w-3" />
                    <span>Ready for deployment</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <Globe className="h-3 w-3" />
                    <span>Works on any server</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <div className="mt-4 text-xs text-gray-400">
              <p className="mb-2">Quick deployment steps:</p>
              <ol className="list-decimal list-inside space-y-1">
                <li>Extract the tar.gz file</li>
                <li>Run <code className="bg-gray-700 px-1 rounded">pnpm install</code></li>
                <li>Run <code className="bg-gray-700 px-1 rounded">pnpm run build</code></li>
                <li>Deploy the <code className="bg-gray-700 px-1 rounded">dist/</code> folder</li>
              </ol>
            </div>
          </div>
        </div>

        <Separator className="my-8 bg-gray-700" />

        {/* Bottom Section */}
        <div className="flex flex-col md:flex-row items-center justify-between">
          <div className="flex items-center space-x-4 mb-4 md:mb-0">
            <p className="text-sm text-gray-400">
              © 2024 Lost & Found AI System. Built with{' '}
              <Heart className="inline h-4 w-4 text-red-500 mx-1" />
              using MGX Platform
            </p>
          </div>
          
          <div className="flex items-center space-x-4">
            <Badge variant="outline" className="border-green-500 text-green-400">
              <div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
              System Online
            </Badge>
            
            <div className="text-xs text-gray-400">
              <span>Powered by YOLOv8m AI</span>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}