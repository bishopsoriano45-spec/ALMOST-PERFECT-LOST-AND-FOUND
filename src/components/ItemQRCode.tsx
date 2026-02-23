import React, { useRef } from 'react';
import QRCode from 'react-qr-code';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
    DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { QrCode, Download, Printer } from 'lucide-react';

interface ItemQRCodeProps {
    url: string;
    title: string;
}

export default function ItemQRCode({ url, title }: ItemQRCodeProps) {
    const qrRef = useRef<HTMLDivElement>(null);

    const handleDownload = () => {
        const svg = qrRef.current?.querySelector("svg");
        if (!svg) return;

        const svgData = new XMLSerializer().serializeToString(svg);
        const canvas = document.createElement("canvas");
        const ctx = canvas.getContext("2d");
        const img = new Image();

        img.onload = () => {
            canvas.width = img.width;
            canvas.height = img.height;
            ctx?.drawImage(img, 0, 0);
            const pngFile = canvas.toDataURL("image/png");
            const downloadLink = document.createElement("a");
            downloadLink.download = `qrcode-${title.replace(/[^a-z0-9]/gi, '-').toLowerCase()}.png`;
            downloadLink.href = pngFile;
            downloadLink.click();
        };

        img.src = "data:image/svg+xml;base64," + btoa(svgData);
    };

    const handlePrint = () => {
        const printWindow = window.open('', '_blank');
        if (!printWindow) return;

        const svg = qrRef.current?.innerHTML;

        printWindow.document.write(`
      <html>
        <head>
          <title>Print QR Code - ${title}</title>
          <style>
            body { 
              display: flex; 
              flex-direction: column; 
              align-items: center; 
              justify-content: center; 
              height: 100vh; 
              font-family: sans-serif; 
            }
            h1 { margin-bottom: 20px; font-size: 24px; }
            .qr-container { margin-bottom: 30px; }
            p { color: #666; }
          </style>
        </head>
        <body>
          <h1>${title}</h1>
          <div class="qr-container">${svg}</div>
          <p>Scan to view item details</p>
          <script>
            window.onload = function() { window.print(); window.close(); }
          </script>
        </body>
      </html>
    `);
        printWindow.document.close();
    };

    return (
        <Dialog>
            <DialogTrigger asChild>
                <Button variant="outline" size="sm">
                    <QrCode className="h-4 w-4 mr-2" />
                    QR Code
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle>QR Code for {title}</DialogTitle>
                    <DialogDescription>
                        Scan this code to quickly access this item page on another device.
                    </DialogDescription>
                </DialogHeader>

                <div className="flex flex-col items-center justify-center py-6 space-y-4">
                    <div
                        ref={qrRef}
                        className="p-4 bg-white border rounded-lg shadow-sm"
                    >
                        <QRCode
                            value={url}
                            size={200}
                            level="H"
                        />
                    </div>

                    <div className="flex flex-row gap-2 w-full justify-center mt-4">
                        <Button variant="outline" size="sm" onClick={handleDownload} className="flex-1">
                            <Download className="h-4 w-4 mr-2" />
                            Download PNG
                        </Button>
                        <Button variant="outline" size="sm" onClick={handlePrint} className="flex-1">
                            <Printer className="h-4 w-4 mr-2" />
                            Print
                        </Button>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}
