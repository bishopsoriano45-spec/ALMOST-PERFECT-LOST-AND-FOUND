const express = require('express');
const cors = require('cors');
const path = require('path');
const db = require('./db/db');
const fs = require('fs');
require('dotenv').config({ path: path.join(__dirname, '.env') });

const app = express();
const PORT = process.env.PORT || 3000;

// Ensure uploads directory exists
const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
    console.log('Created uploads directory');
}

// Middleware
app.use(cors());
app.use(express.json()); // Ensure this is before routes
app.use(express.urlencoded({ extended: true }));

// Debug middleware to verify new version
app.use((req, res, next) => {
    res.set('X-Server-Version', 'new');
    next();
});

// Serve static files from the "uploads" directory
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Routes
const itemsRoutes = require('./routes/items');
const usersRoutes = require('./routes/users');
const aiRoutes = require('./routes/ai');
const notificationsRoutes = require('./routes/notifications');
const adminRoutes = require('./routes/admin'); // Import admin routes

app.use('/api/users', usersRoutes);
app.use('/api/items', itemsRoutes);
app.use('/api/admin', adminRoutes); // FIX: Register admin routes only once (removed duplicate)
app.use('/api/ai', aiRoutes);
app.use('/api/notifications', notificationsRoutes);
app.use('/api/feedback', require('./routes/feedback')); // Feedback route

// Health check endpoint
app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', message: 'Lost & Found Backend is healthy' });
});

// Serve frontend static files if they exist
const distPath = path.join(__dirname, '../dist');
if (fs.existsSync(distPath)) {
    app.use(express.static(distPath));

    // Handle React routing, return all requests to React app
    app.use((req, res, next) => {
        // Skip API routes here to avoid returning HTML for 404 API calls
        if (req.path.startsWith('/api/') || req.path.startsWith('/uploads/')) {
            return next();
        }
        res.sendFile(path.join(distPath, 'index.html'));
    });
} else {
    // Basic root endpoint if frontend is hosted separately
    app.get('/', (req, res) => {
        res.send('Almost Perfect Lost & Found API is running.');
    });
}

// Global Error Handler
app.use((err, req, res, next) => {
    console.error('🔥 Unhandled application error:', err);
    res.status(500).json({
        success: false,
        error: 'Internal Server Error',
        details: err.message,
        stack: err.stack
    });
});

const QueueService = require('./services/QueueService');
const TrainingService = require('./services/TrainingService');

// Background Worker Loop
const WORKER_INTERVAL = 10000; // 10 seconds
setInterval(async () => {
    try {
        const job = await QueueService.getNextJob();
        if (job) {
            console.log(`[Worker] Processing job ${job.id} (${job.job_type})...`);
            try {
                if (job.job_type === 'TRAIN_MODEL') {
                    await TrainingService.runTrainingJob(job);
                } else {
                    console.warn(`[Worker] Unknown job type: ${job.job_type}`);
                }
                await QueueService.completeJob(job.id);
            } catch (err) {
                console.error(`[Worker] Job ${job.id} failed:`, err);
                await QueueService.failJob(job.id, err.message);
            }
        }
    } catch (err) {
        console.error('[Worker] Error in worker loop:', err);
    }
}, WORKER_INTERVAL);

app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server is running on port ${PORT}`);
    console.log(`Background worker started (interval: ${WORKER_INTERVAL}ms)`);
});
