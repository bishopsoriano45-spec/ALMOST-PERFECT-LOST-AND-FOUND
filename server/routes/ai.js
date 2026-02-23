const express = require('express');
const router = express.Router();
const multer = require('multer');
const axios = require('axios');
const FormData = require('form-data');
const fs = require('fs');

const path = require('path');

const upload = multer({ dest: path.join(__dirname, '..', 'uploads') }); // Use absolute path
const AI_SERVICE_URL = process.env.AI_SERVICE_URL || 'http://localhost:5000';

router.post('/detect', upload.single('image'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ error: 'No image uploaded' });
        }

        const formData = new FormData();
        formData.append('file', fs.createReadStream(req.file.path), req.file.originalname);

        const response = await axios.post(`${AI_SERVICE_URL}/detect`, formData, {
            headers: {
                ...formData.getHeaders()
            }
        });

        // Cleanup uploaded file after sending
        fs.unlinkSync(req.file.path);

        res.json(response.data);
    } catch (error) {
        console.error('AI Service Error:', error.message);
        if (error.response) {
            console.error('AI Service Response Data:', error.response.data);
            console.error('AI Service Status:', error.response.status);
        }
        res.status(500).json({ error: 'Failed to process image with AI service', details: error.response?.data });
    }
});

router.post('/analyze-hybrid', upload.single('image'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ error: 'No image uploaded' });
        }

        const formData = new FormData();
        formData.append('file', fs.createReadStream(req.file.path), req.file.originalname);

        // Pass optional context
        if (req.body.context) {
            formData.append('context', req.body.context);
        }

        const response = await axios.post(`${AI_SERVICE_URL}/analyze-hybrid`, formData, {
            headers: {
                ...formData.getHeaders()
            }
        });

        // Cleanup uploaded file after sending
        fs.unlinkSync(req.file.path);

        res.json(response.data);
    } catch (error) {
        console.error('AI Hybrid Service Error:', error.message);
        if (error.response) {
            console.error('AI Hybrid Service Response Data:', error.response.data);
            console.error('AI Hybrid Service Status:', error.response.status);
        }
        res.status(500).json({
            error: 'Failed to process image with Hybrid AI service',
            details: error.response?.data || error.message,
            target_url: `${AI_SERVICE_URL}/analyze-hybrid` // Help debug if URL is wrong
        });
    }
});

// Built-in fallback chat responses when AI service is unavailable
function getFallbackChatResponse(message) {
    const msg = (message || '').toLowerCase().trim();

    if (msg.includes('i found something') || msg.includes('found an item') || msg.includes('report found')) {
        return {
            response: "Great that you found something! To help us return it to the owner, please provide these details:\n\n1. **What is the item?** (e.g., phone, wallet, keys, bag)\n2. **Where did you find it?** (specific location)\n3. **When did you find it?** (date and time)\n4. **Any distinguishing features?** (color, brand, condition)\n\nYou can also upload a photo for better matching!",
            suggestions: ['It\'s a phone', 'It\'s a wallet', 'It\'s a bag', 'It\'s something else'],
            extracted_info: { type: 'found' }
        };
    }

    if (msg.includes('i lost my phone') || msg.includes('lost phone')) {
        return {
            response: "I'm sorry to hear you lost your phone! Let me help you create a detailed report. Can you tell me:\n\n1. **What brand/model?** (e.g., iPhone 15, Samsung Galaxy S24)\n2. **What color?**\n3. **Where did you last see it?**\n4. **Any case or distinguishing features?**",
            suggestions: ['iPhone', 'Samsung', 'I don\'t remember the model', 'It has a case'],
            extracted_info: { type: 'lost', category: 'electronics', subcategory: 'phone' }
        };
    }

    if (msg.includes('i lost my wallet') || msg.includes('lost wallet')) {
        return {
            response: "I'll help you report your lost wallet. Please share these details:\n\n1. **What color/material?** (e.g., black leather, brown fabric)\n2. **What brand?** (if known)\n3. **Where did you last have it?**\n4. **Any unique identifiers?** (stickers, initials, etc.)",
            suggestions: ['Black leather wallet', 'Brown wallet', 'I had it at the cafeteria', 'It has my ID inside'],
            extracted_info: { type: 'lost', category: 'accessories', subcategory: 'wallet' }
        };
    }

    if (msg.includes('i lost my keys') || msg.includes('lost keys') || msg.includes('lost my key')) {
        return {
            response: "Let's help you find your keys! Please describe:\n\n1. **How many keys?** And what type (car key, house key, etc.)\n2. **Any keychain or accessories?**\n3. **Where did you last use them?**\n4. **When did you notice they were missing?**",
            suggestions: ['Car keys', 'House keys', 'I had a keychain', 'I lost them today'],
            extracted_info: { type: 'lost', category: 'accessories', subcategory: 'keys' }
        };
    }

    if (msg.includes('it\'s a phone') || msg.includes('its a phone') || msg.includes('found a phone')) {
        return {
            response: "You found a phone! That's very helpful. Can you provide more details?\n\n1. **What brand/model?** (iPhone, Samsung, etc.)\n2. **What color?**\n3. **Is the screen intact or cracked?**\n4. **Is it powered on?\n\nPlease take a photo if possible — it will significantly improve matching!",
            suggestions: ['It\'s an iPhone', 'It\'s a Samsung', 'Screen is cracked', 'I\'ll upload a photo'],
            extracted_info: { type: 'found', category: 'electronics', subcategory: 'phone' }
        };
    }

    if (msg.includes('it\'s a wallet') || msg.includes('its a wallet') || msg.includes('found a wallet')) {
        return {
            response: "You found a wallet! Please describe it:\n\n1. **What color and material?**\n2. **Does it contain any identification?** (Please don't share personal info here)\n3. **Where exactly did you find it?**\n\nUploading a photo will help the owner identify it!",
            suggestions: ['It has an ID inside', 'It\'s a black wallet', 'I\'ll upload a photo', 'Found it on campus'],
            extracted_info: { type: 'found', category: 'accessories', subcategory: 'wallet' }
        };
    }

    if (msg.includes('it\'s a bag') || msg.includes('its a bag') || msg.includes('found a bag') || msg.includes('backpack')) {
        return {
            response: "You found a bag! Please help us identify it:\n\n1. **What type?** (backpack, handbag, laptop bag, etc.)\n2. **What color and brand?**\n3. **Where did you find it?**\n4. **Any visible contents or tags?**",
            suggestions: ['It\'s a backpack', 'It\'s a laptop bag', 'I\'ll upload a photo', 'Found near the library'],
            extracted_info: { type: 'found', category: 'bags', subcategory: 'bag' }
        };
    }

    // Generic fallback
    return {
        response: "I'd love to help! Could you tell me more about your situation? Are you trying to:\n\n- **Report a lost item** — I'll help you create a detailed description\n- **Report a found item** — I'll guide you through the process\n- **Search for your item** — I'll help you check current listings",
        suggestions: ['I lost my phone', 'I lost my wallet', 'I lost my keys', 'I found something']
    };
}

router.post('/chat', upload.none(), async (req, res) => {
    try {
        const formData = new FormData();
        formData.append('message', req.body.message);
        if (req.body.context) {
            formData.append('context', req.body.context);
        }

        const response = await axios.post(`${AI_SERVICE_URL}/chat`, formData, {
            headers: {
                ...formData.getHeaders()
            },
            timeout: 5000 // 5 second timeout to fail fast
        });

        res.json(response.data);
    } catch (error) {
        console.warn('AI Chat service unavailable, using fallback:', error.message);
        // Use built-in fallback instead of returning a 500 error
        const fallbackResponse = getFallbackChatResponse(req.body.message);
        res.json(fallbackResponse);
    }
});

router.post('/feedback', async (req, res) => {
    try {
        const { itemId, imageUrl, predictedClass, predictedConfidence, actualClass, isCorrect, notes } = req.body;
        // Validate required fields
        if (isCorrect === undefined || !imageUrl) {
            return res.status(400).json({ error: 'Missing required fields (isCorrect, imageUrl)' });
        }

        const TrainingService = require('../services/TrainingService');
        const result = await TrainingService.handleFeedback(
            itemId,
            imageUrl,
            predictedClass,
            predictedConfidence,
            actualClass,
            isCorrect,
            notes
        );
        res.json(result);
    } catch (error) {
        console.error('Feedback Error:', error);
        res.status(500).json({ error: 'Failed to process feedback' });
    }
});

module.exports = router;
