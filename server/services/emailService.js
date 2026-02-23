const nodemailer = require('nodemailer');
require('dotenv').config();

/**
 * Email Service - Sends email notifications to users
 */

// Email configuration
const EMAIL_CONFIG = {
    service: process.env.EMAIL_SERVICE || 'gmail',
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASSWORD
    }
};

const FROM_EMAIL = process.env.EMAIL_FROM || 'Lost & Found System <noreply@lostfound.com>';
const APP_URL = process.env.APP_URL || 'http://localhost:5173';
const ENABLE_EMAIL = process.env.ENABLE_EMAIL_NOTIFICATIONS === 'true';

// Create transporter
let transporter = null;

function getTransporter() {
    if (!transporter && ENABLE_EMAIL) {
        try {
            console.log(`[EMAIL] Initializing transporter for service: ${EMAIL_CONFIG.service}, user: ${EMAIL_CONFIG.auth.user}`);
            transporter = nodemailer.createTransport(EMAIL_CONFIG);
            console.log('[EMAIL] Email transporter initialized successfully');
        } catch (error) {
            console.error('[EMAIL] Failed to initialize email transporter:', error);
        }
    } else if (!ENABLE_EMAIL) {
        console.log('[EMAIL] Email notifications are disabled in configuration');
    }
    return transporter;
}

/**
 * Generate HTML email template for match notification
 */
function generateMatchEmailHTML(data) {
    const { userName, userItemTitle, matchedItemTitle, matchScore, confidence, explanation, matchedItem, itemLink } = data;

    const confidenceColor = confidence === 'high' ? '#22c55e' : confidence === 'medium' ? '#f59e0b' : '#6b7280';
    const confidenceBadge = confidence.toUpperCase();

    return `
        < !DOCTYPE html >
            <html>
                <head>
                    <meta charset="utf-8">
                        <meta name="viewport" content="width=device-width, initial-scale=1.0">
                            <title>Match Found!</title>
                        </head>
                        <body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f3f4f6;">
                            <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f3f4f6; padding: 40px 20px;">
                                <tr>
                                    <td align="center">
                                        <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 12px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1); overflow: hidden;">
                                            <!-- Header -->
                                            <tr>
                                                <td style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 40px 30px; text-align: center;">
                                                    <h1 style="margin: 0; color: #ffffff; font-size: 28px; font-weight: 700;">
                                                        🎯 Match Found!
                                                    </h1>
                                                    <p style="margin: 10px 0 0 0; color: #e0e7ff; font-size: 16px;">
                                                        We found a potential match for your item
                                                    </p>
                                                </td>
                                            </tr>

                                            <!-- Content -->
                                            <tr>
                                                <td style="padding: 40px 30px;">
                                                    <p style="margin: 0 0 20px 0; color: #374151; font-size: 16px; line-height: 1.6;">
                                                        Hi <strong>${userName}</strong>,
                                                    </p>
                                                    <p style="margin: 0 0 30px 0; color: #374151; font-size: 16px; line-height: 1.6;">
                                                        Great news! We found an item that matches your <strong>${userItemTitle}</strong>.
                                                    </p>

                                                    <!-- Match Score -->
                                                    <div style="background: linear-gradient(135deg, #dbeafe 0%, #dcfce7 100%); border-radius: 8px; padding: 20px; margin-bottom: 30px; text-align: center;">
                                                        <div style="font-size: 48px; font-weight: 700; color: #1e40af; margin-bottom: 10px;">
                                                            ${Math.round(matchScore * 100)}%
                                                        </div>
                                                        <div style="font-size: 14px; color: #4b5563; margin-bottom: 10px;">
                                                            Match Similarity
                                                        </div>
                                                        <span style="display: inline-block; background-color: ${confidenceColor}; color: #ffffff; padding: 6px 16px; border-radius: 20px; font-size: 12px; font-weight: 600;">
                                                            ${confidenceBadge} CONFIDENCE
                                                        </span>
                                                    </div>

                                                    <!-- Matched Item Details -->
                                                    <div style="border: 2px solid #e5e7eb; border-radius: 8px; padding: 20px; margin-bottom: 30px;">
                                                        <h3 style="margin: 0 0 15px 0; color: #111827; font-size: 18px; font-weight: 600;">
                                                            Matched Item
                                                        </h3>
                                                        ${matchedItem.imageUrl ? `
                                <div style="margin-bottom: 15px;">
                                    <img src="cid:matchImage" alt="${matchedItemTitle}" style="max-width: 100%; height: auto; border-radius: 6px; display: block;">
                                </div>
                                ` : ''}
                                                        <p style="margin: 0 0 10px 0; color: #111827; font-size: 16px; font-weight: 600;">
                                                            ${matchedItemTitle}
                                                        </p>
                                                        ${matchedItem.description ? `
                                <p style="margin: 0 0 10px 0; color: #4b5563; font-size: 14px;">
                                    ${matchedItem.description}
                                </p>
                                ` : ''}
                                                        ${matchedItem.location ? `
                                <p style="margin: 0 0 8px 0; color: #6b7280; font-size: 14px;">
                                    📍 <strong>Location:</strong> ${matchedItem.location}
                                </p>
                                ` : ''}
                                                        ${matchedItem.dateReported ? `
                                <p style="margin: 0; color: #6b7280; font-size: 14px;">
                                    📅 <strong>Reported:</strong> ${new Date(matchedItem.dateReported).toLocaleDateString()}
                                </p>
                                ` : ''}
                                                    </div>

                                                    <!-- Match Explanation -->
                                                    ${explanation && explanation.length > 0 ? `
                            <div style="background-color: #f9fafb; border-left: 4px solid #667eea; padding: 15px 20px; margin-bottom: 30px; border-radius: 4px;">
                                <h4 style="margin: 0 0 10px 0; color: #374151; font-size: 14px; font-weight: 600;">
                                    Why this matches:
                                </h4>
                                <ul style="margin: 0; padding-left: 20px; color: #6b7280; font-size: 14px; line-height: 1.8;">
                                    ${explanation.map(reason => `<li>${reason}</li>`).join('')}
                                </ul>
                            </div>
                            ` : ''}

                                                    <!-- CTA Buttons -->
                                                    <div style="text-align: center; margin: 30px 0;">
                                                        <a href="${itemLink}" style="display: inline-block; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: #ffffff; text-decoration: none; padding: 14px 32px; border-radius: 8px; font-size: 16px; font-weight: 600; box-shadow: 0 4px 6px rgba(102, 126, 234, 0.4); margin-bottom: 12px;">
                                                            View Match Details
                                                        </a>
                                                        <br>
                                                            <a href="${itemLink}?action=claim" style="display: inline-block; color: #667eea; text-decoration: none; font-size: 14px; font-weight: 600;">
                                                                This is my item (Claim)
                                                            </a>
                                                    </div>

                                                    <p style="margin: 30px 0 0 0; color: #6b7280; font-size: 14px; line-height: 1.6; text-align: center;">
                                                        <strong>How to Claim:</strong><br>
                                                        Please visit the <strong>Lost & Found Office</strong> to verify and claim your item.<br>
                                                        Bring your ID and any proof of ownership.
                                                    </p>
                                                    <p style="margin: 10px 0 0 0; color: #6b7280; font-size: 14px; line-height: 1.6; text-align: center;">
                                                        You can also click the button above to "Claim" it online and alert the Admin.
                                                    </p>
                                                </td>
                                            </tr>

                                            <!-- Footer -->
                                            <tr>
                                                <td style="background-color: #f9fafb; padding: 30px; border-top: 1px solid #e5e7eb; text-align: center;">
                                                    <p style="margin: 0 0 10px 0; color: #6b7280; font-size: 12px;">
                                                        You're receiving this email because you reported an item on Lost & Found System.
                                                    </p>
                                                    <p style="margin: 0 0 10px 0; color: #9ca3af; font-size: 12px;">
                                                        © ${new Date().getFullYear()} Lost & Found System. All rights reserved.
                                                    </p>
                                                    <p style="margin: 0; color: #9ca3af; font-size: 12px;">
                                                        <a href="${APP_URL}/unsubscribe" style="color: #6b7280; text-decoration: underline;">Unsubscribe</a>
                                                    </p>
                                                </td>
                                            </tr>
                                        </table>
                                    </td>
                                </tr>
                            </table>
                        </body>
                    </html>
                    `;
}

/**
 * Generate plain text version of match email
 */
function generateMatchEmailText(data) {
    const { userName, userItemTitle, matchedItemTitle, matchScore, confidence, explanation, matchedItem, itemLink } = data;

    let text = `Hi ${userName},\n\n`;
    text += `Great news! We found an item that matches your ${userItemTitle}.\n\n`;
    text += `MATCH SIMILARITY: ${Math.round(matchScore * 100)}%\n`;
    text += `CONFIDENCE: ${confidence.toUpperCase()}\n\n`;
    text += `MATCHED ITEM:\n`;
    text += `${matchedItemTitle}\n`;
    if (matchedItem.location) {
        text += `Location: ${matchedItem.location}\n`;
    }
    if (matchedItem.dateReported) {
        text += `Reported: ${new Date(matchedItem.dateReported).toLocaleDateString()}\n`;
    }
    text += `\n`;

    if (explanation && explanation.length > 0) {
        text += `WHY THIS MATCHES:\n`;
        explanation.forEach(reason => {
            text += `- ${reason}\n`;
        });
        text += `\n`;
    }

    text += `View match details: ${itemLink}\n\n`;
    text += `HOW TO CLAIM:\n`;
    text += `Please visit the Lost & Found Office to verify and claim your item. Bring your ID and proof of ownership.\n`;
    text += `You can also click the link above and select "Claim This Item" to notify the Admin.\n\n`;
    text += `---\n`;
    text += `You're receiving this email because you reported an item on Lost & Found System.\n`;

    return text;
}

/**
 * Send match notification email
 */
async function sendMatchNotificationEmail(userEmail, data) {
    if (!ENABLE_EMAIL) {
        console.log('Email notifications disabled');
        return { success: false, message: 'Email notifications disabled' };
    }

    const transport = getTransporter();
    if (!transport) {
        console.error('Email transporter not available');
        return { success: false, message: 'Email service not configured' };
    }

    try {
        const mailOptions = {
            from: FROM_EMAIL,
            to: userEmail,
            subject: `🎯 Match Found for Your ${data.userItemTitle}!`,
            text: generateMatchEmailText(data),
            html: generateMatchEmailHTML(data),
            attachments: []
        };

        // Add image attachment if available
        if (data.matchedItem.imageUrl) {
            // Check if it's a URL or local path
            if (data.matchedItem.imageUrl.startsWith('http')) {
                mailOptions.attachments.push({
                    filename: 'match-image.jpg',
                    path: data.matchedItem.imageUrl,
                    cid: 'matchImage' // Optional: allows inline embedding with <img src="cid:matchImage"/>
                });
            } else {
                // Assume local path if not http
                // This requires the caller to provide a valid path or we resolve it
                // For safety, let's stick to URLs or absolute paths passed in data
                mailOptions.attachments.push({
                    filename: 'match-image.jpg',
                    path: data.matchedItem.imageUrl
                });
            }
        }

        const info = await transport.sendMail(mailOptions);
        console.log('Match notification email sent:', info.messageId);
        return { success: true, messageId: info.messageId };
    } catch (error) {
        console.error('Error sending match notification email:', error);
        return { success: false, error: error.message };
    }
}

/**
 * Send generic email
 */
async function sendEmail(to, subject, text, html) {
    if (!ENABLE_EMAIL) {
        console.log('Email notifications disabled');
        return { success: false, message: 'Email notifications disabled' };
    }

    const transport = getTransporter();
    if (!transport) {
        console.error('Email transporter not available');
        return { success: false, message: 'Email service not configured' };
    }

    try {
        const mailOptions = {
            from: FROM_EMAIL,
            to,
            subject,
            text,
            html: html || text
        };

        const info = await transport.sendMail(mailOptions);
        console.log('Email sent:', info.messageId);
        return { success: true, messageId: info.messageId };
    } catch (error) {
        console.error('Error sending email:', error);
        return { success: false, error: error.message };
    }
}

/**
 * Test email configuration
 */
async function testEmailConfiguration() {
    if (!ENABLE_EMAIL) {
        return { success: false, message: 'Email notifications disabled in configuration' };
    }

    const transport = getTransporter();
    if (!transport) {
        return { success: false, message: 'Failed to create email transporter' };
    }

    try {
        await transport.verify();
        return { success: true, message: 'Email configuration is valid' };
    } catch (error) {
        return { success: false, message: 'Email configuration error: ' + error.message };
    }
}

module.exports = {
    sendMatchNotificationEmail,
    sendEmail,
    testEmailConfiguration
};
