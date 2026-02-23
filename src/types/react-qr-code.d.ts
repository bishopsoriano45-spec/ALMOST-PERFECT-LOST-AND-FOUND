declare module 'react-qr-code' {
    import * as React from 'react';

    export interface QRCodeProps extends React.SVGProps<SVGElement> {
        value: string;
        size?: number; // Size of the QR Code (defaults to 128)
        level?: 'L' | 'M' | 'Q' | 'H'; // Error correction level
        bgColor?: string; // Background color
        fgColor?: string; // Foreground color
    }

    const QRCode: React.FC<QRCodeProps>;
    export default QRCode;
}
