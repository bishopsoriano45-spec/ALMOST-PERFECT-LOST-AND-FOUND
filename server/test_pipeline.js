const { pool } = require('./db/db');
const TrainingService = require('./services/TrainingService');
const QueueService = require('./services/QueueService');

async function testPipeline() {
    console.log('🧪 Starting Auto-Learning Pipeline Test...');

    try {
        // 1. Check initial state
        const initialCountRes = await pool.query('SELECT COUNT(*) FROM ai_feedback WHERE processed = FALSE');
        const initialCount = parseInt(initialCountRes.rows[0].count);
        console.log(`📊 Initial pending feedback count: ${initialCount}`);

        const needed = 50 - initialCount;
        if (needed <= 0) {
            console.log('⚠️ Threshold already reached. Triggering manual check...');
            // In a real scenario, the next feedback would trigger it.
        }

        // 2. Simulate User Feedback
        console.log(`📝 Simulating ${Math.max(needed, 1)} feedback submissions to reach threshold...`);

        // We'll add slightly more than needed to be sure
        const iterations = Math.max(needed, 1) + 2;

        for (let i = 0; i < iterations; i++) {
            await TrainingService.handleFeedback(
                56, // Valid Item ID found by check_item.js
                // Schema says: REFERENCES lost_items(id). We might need a valid item ID.
                // Let's check if we can insert with a dummy item or if we need to fetch one.
                'http://localhost:5000/uploads/test_image.jpg',
                'phone',
                0.85,
                'tablet', // Correction
                false, // isCorrect
                'Test feedback from verification script'
            );
            if (i % 10 === 0) process.stdout.write('.');
        }
        console.log('\n✅ Feedback submission complete.');

        // 3. Verify Job Queue
        console.log('🔍 Checking background_jobs table...');
        const jobRes = await pool.query("SELECT * FROM background_jobs WHERE job_type = 'TRAIN_MODEL' AND status = 'pending' ORDER BY created_at DESC LIMIT 1");

        if (jobRes.rows.length > 0) {
            const job = jobRes.rows[0];
            console.log(`🎉 SUCCESS: Found pending training job!`);
            console.log(`   Job ID: ${job.id}`);
            console.log(`   Type: ${job.job_type}`);
            console.log(`   Payload:`, job.payload);
            console.log(`   Created At: ${job.created_at}`);

            // 4. (Optional) Run the worker logic manually for a dry run?
            // console.log('🏃 Attempting to execute training job (dry run)...');
            // await TrainingService.runTrainingJob(job); 
        } else {
            console.error('❌ FAILURE: No pending training job found after reaching threshold.');
        }

    } catch (error) {
        if (error.code === '23503') { // Foreign key violation
            console.error('❌ Database Error: Could not find valid item_id=1. Please create a lost item first.');
        } else {
            console.error('❌ Test Failed:', error);
        }
    } finally {
        await pool.end();
    }
}

testPipeline();
