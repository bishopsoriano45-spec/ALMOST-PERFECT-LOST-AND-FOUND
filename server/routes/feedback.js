const express = require('express');
const router = express.Router();
const feedbackService = require('../services/feedbackService');
const { checkAdmin } = require('../middleware/auth');

// Public: Submit feedback
router.post('/', async (req, res) => {
    try {
        const feedback = await feedbackService.createFeedback(req.body);
        res.status(201).json(feedback);
    } catch (error) {
        console.error('Error submitting feedback:', error);
        res.status(500).json({ error: 'Failed to submit feedback' });
    }
});

// Admin: Get all feedback
router.get('/', checkAdmin, async (req, res) => {
    try {
        const feedback = await feedbackService.getAllFeedback();
        res.json(feedback);
    } catch (error) {
        console.error('Error fetching feedback:', error);
        res.status(500).json({ error: 'Failed to fetch feedback' });
    }
});

// Admin: Update status
router.patch('/:id/status', checkAdmin, async (req, res) => {
    try {
        const { status } = req.body;
        const feedback = await feedbackService.updateFeedbackStatus(req.params.id, status);
        res.json(feedback);
    } catch (error) {
        console.error('Error updating feedback status:', error);
        res.status(500).json({ error: 'Failed to update status' });
    }
});

module.exports = router;
