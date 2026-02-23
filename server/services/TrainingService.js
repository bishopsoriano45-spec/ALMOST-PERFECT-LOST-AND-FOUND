const { pool } = require('../db/db');
const QueueService = require('./QueueService');
const axios = require('axios');

const BATCH_SIZE = 50; // Number of feedback items required to trigger training
const AI_SERVICE_URL = 'http://localhost:5000'; // Adjust if needed

class TrainingService {

    /**
     * Process user feedback and check if training should be triggered.
     */
    static async handleFeedback(itemId, imageUrl, predictedClass, predictedConfidence, actualClass, isCorrect, notes) {
        const client = await pool.connect();
        try {
            await client.query('BEGIN');

            // 1. Save feedback
            await client.query(`
                INSERT INTO ai_feedback 
                (item_id, image_url, predicted_class, predicted_confidence, actual_class, is_correct, feedback_notes)
                VALUES ($1, $2, $3, $4, $5, $6, $7)
            `, [itemId, imageUrl, predictedClass, predictedConfidence, actualClass, isCorrect, notes]);

            console.log(`[Training] Feedback saved for item ${itemId}`);

            // 2. Check unprocessed count
            const countResult = await client.query(`
                SELECT COUNT(*) as count FROM ai_feedback WHERE processed = FALSE
            `);
            const pendingCount = parseInt(countResult.rows[0].count);

            console.log(`[Training] Pending feedback count: ${pendingCount}/${BATCH_SIZE}`);

            // 3. Trigger training if threshold reached
            if (pendingCount >= BATCH_SIZE) {
                console.log('[Training] Batch size reached. Queueing training job...');
                await QueueService.addJob('TRAIN_MODEL', {
                    reason: 'batch_threshold_reached',
                    count: pendingCount
                });
            }

            await client.query('COMMIT');
            return { success: true, pendingCount };
        } catch (error) {
            await client.query('ROLLBACK');
            console.error('[Training] Error handling feedback:', error);
            throw error;
        } finally {
            client.release();
        }
    }

    /**
     * Execute the training logic (To be called by the Queue Worker)
     */
    static async runTrainingJob(job) {
        console.log(`[Training] Starting training job ${job.id}...`);

        return new Promise((resolve, reject) => {
            const { spawn } = require('child_process');
            const path = require('path');

            // Path to python script
            const scriptPath = path.resolve(__dirname, '../../ai_service/train_continuous.py');

            console.log(`[Training] Spawning python script: ${scriptPath}`);
            const pythonProcess = spawn('python', [scriptPath, '--epochs', '5']);

            let output = '';
            let errorOutput = '';

            pythonProcess.stdout.on('data', (data) => {
                const lines = data.toString();
                output += lines;
                console.log(`[Training Script] ${lines.trim()}`);
            });

            pythonProcess.stderr.on('data', (data) => {
                errorOutput += data.toString();
                console.error(`[Training Script Error] ${data.toString().trim()}`);
            });

            pythonProcess.on('close', async (code) => {
                console.log(`[Training] Process exited with code ${code}`);

                if (code === 0) {
                    // Success
                    resolve({ success: true, message: 'Training completed successfully' });
                } else {
                    reject(new Error(`Training script failed with code ${code}. Error: ${errorOutput}`));
                }
            });

            pythonProcess.on('error', (err) => {
                reject(new Error(`Failed to start python process: ${err.message}`));
            });
        });
    }
}

module.exports = TrainingService;
