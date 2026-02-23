const express = require('express');
const router = express.Router();
const adminService = require('../services/adminService');
const claimsService = require('../services/claimsService');
const jwt = require('jsonwebtoken');

// Admin Credentials
const ADMIN_USER = process.env.ADMIN_USER || 'admin';
const ADMIN_PASS = process.env.ADMIN_PASS || 'admin123';
const { checkAdmin, JWT_SECRET } = require('../middleware/auth');

// Login Route
router.post('/login', async (req, res) => {
    const { username, password } = req.body;

    // First check hardcoded admin
    if (username === ADMIN_USER && password === ADMIN_PASS) {
        // Issue JWT
        const token = jwt.sign({ role: 'admin', username: ADMIN_USER }, JWT_SECRET, { expiresIn: '24h' });
        return res.json({ success: true, token });
    }

    // Check if it's a database user with the 'admin' role
    try {
        const authService = require('../services/authService');
        // The 'username' field from the admin login form is expected to be the user's email
        const user = await authService.loginUser(username, password);
        if (user && user.role === 'admin') {
            const token = jwt.sign({ role: 'admin', username: user.email, userId: user.user_id }, JWT_SECRET, { expiresIn: '24h' });
            return res.json({ success: true, token });
        }
    } catch (error) {
        // authService.loginUser throws on invalid credentials, we let it fall through to the 401 response
        console.error('Admin DB login error/fallback:', error.message);
    }

    res.status(401).json({ success: false, error: 'Invalid credentials' });
});

// Middleware import handling

// Dashboard Stats
router.get('/stats', checkAdmin, async (req, res) => {
    try {
        const stats = await adminService.getDashboardStats();
        res.json(stats);
    } catch (error) {
        console.error('Error fetching admin stats:', error);
        res.status(500).json({ error: 'Failed to fetch statistics' });
    }
});

// Points Stats
router.get('/points/stats', checkAdmin, async (req, res) => {
    try {
        console.log("📊 Points stats endpoint hit");
        const stats = await adminService.getPointsStats();
        res.json({
            success: true,
            data: stats
        });
    } catch (error) {
        console.error('❌ Points stats fatal error:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch points statistics',
            details: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
});

// Users Management
router.get('/users', checkAdmin, async (req, res) => {
    try {
        const users = await adminService.getUsers();
        res.json(users);
    } catch (error) {
        console.error('Error fetching users:', error);
        res.status(500).json({ error: 'Failed to fetch users' });
    }
});

router.patch('/users/:id', checkAdmin, async (req, res) => {
    try {
        const user = await adminService.updateUser(req.params.id, req.body);
        res.json(user);
    } catch (error) {
        console.error('Error updating user:', error);
        res.status(500).json({ error: 'Failed to update user' });
    }
});

router.post('/users/:id/reset-points', checkAdmin, async (req, res) => {
    try {
        const user = await adminService.resetUserPoints(req.params.id);
        res.json(user);
    } catch (error) {
        console.error('Error resetting points:', error);
        res.status(500).json({ error: 'Failed to reset points' });
    }
});

router.post('/users/reset-all-points', checkAdmin, async (req, res) => {
    try {
        const result = await adminService.resetAllUserPoints();
        res.json({ message: 'All user points reset successfully', count: result.count });
    } catch (error) {
        console.error('Error resetting all points:', error);
        res.status(500).json({ error: 'Failed to reset all points' });
    }
});

// Claims Management
router.get('/claims', checkAdmin, async (req, res) => {
    try {
        const status = req.query.status || 'all';
        const claims = await claimsService.getClaims(status);
        res.json(claims);
    } catch (error) {
        console.error('Error fetching claims:', error);
        res.status(500).json({ error: 'Failed to fetch claims' });
    }
});

// Public: Create Claim (No Auth Required)
router.post('/claims', async (req, res) => {
    try {
        const claim = await claimsService.createClaim(req.body);
        res.status(201).json(claim);
    } catch (error) {
        console.error('Error creating claim:', error);
        res.status(500).json({
            error: 'Failed to create claim',
            details: error.message,
            stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
        });
    }
});

router.post('/claims/:id/process', checkAdmin, async (req, res) => {
    try {
        const { decision, notes } = req.body;
        if (!['approved', 'rejected'].includes(decision)) {
            return res.status(400).json({ error: 'Invalid decision' });
        }

        const claim = await claimsService.processClaim(req.params.id, decision, notes);
        res.json(claim);
    } catch (error) {
        console.error('Error processing claim:', error);
        res.status(500).json({ error: 'Failed to process claim' });
    }
});

// Delete Claim
router.delete('/claims/:id', checkAdmin, async (req, res) => {
    try {
        const { pool } = require('../db/db');
        const result = await pool.query('DELETE FROM claims WHERE id = $1 RETURNING *', [req.params.id]);
        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Claim not found' });
        }
        res.json({ success: true, message: 'Claim deleted successfully' });
    } catch (error) {
        console.error('Error deleting claim:', error);
        res.status(500).json({ error: 'Failed to delete claim' });
    }
});

module.exports = router;
