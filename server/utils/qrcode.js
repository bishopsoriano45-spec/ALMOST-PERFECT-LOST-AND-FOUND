const QRCode = require('qrcode');

/**
 * Generate a QR code as a data URL
 * @param {string} itemId - The item ID (e.g., "lost_123" or "found_456")
 * @returns {Promise<string>} QR code data URL
 */
async function generateQRCode(itemId) {
    try {
        const baseUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
        const itemUrl = `${baseUrl}/item/${itemId}`;

        // Generate QR code as data URL
        const qrCodeDataUrl = await QRCode.toDataURL(itemUrl, {
            errorCorrectionLevel: 'M',
            type: 'image/png',
            quality: 0.92,
            margin: 1,
            width: 300
        });

        return qrCodeDataUrl;
    } catch (error) {
        console.error('QR Code generation error:', error);
        return null;
    }
}

module.exports = { generateQRCode };
