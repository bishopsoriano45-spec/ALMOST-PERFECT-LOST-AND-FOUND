const express = require('express');
const router = express.Router();
const db = require('../db/db');

const authService = require('../services/authService');

// Register User
router.post('/register', async (req, res) => {
    try {
        const { email, password, name } = req.body;
        if (!email || !password) {
            return res.status(400).json({ error: 'Email and password are required' });
        }

        const user = await authService.registerUser(email, password, name);
        res.status(201).json(user);
    } catch (error) {
        console.error('Registration error:', error);
        res.status(400).json({ error: error.message });
    }
});

// Login User
router.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body;
        if (!email || !password) {
            return res.status(400).json({ error: 'Email and password are required' });
        }

        const user = await authService.loginUser(email, password);
        // In a real app, generate JWT here
        res.json({
            token: 'mock-jwt-token-' + user.user_id,
            user: user
        });
    } catch (error) {
        console.error('Login error:', error);
        res.status(401).json({ error: error.message });
    }
});


module.exports = router;
