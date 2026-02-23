const QueueService = require('./services/QueueService');
const TrainingService = require('./services/TrainingService');

const POLL_INTERVAL = 5000; // 5 seconds

async function startWorker() {
    console.log('[Worker] Starting background worker...');

    // Infinite loop to poll for jobs
    while (true) {
        try {
            const job = await QueueService.getNextJob();

            if (job) {
                console.log(`[Worker] Processing job ${job.id} (Type: ${job.job_type})`);

                try {
                    switch (job.job_type) {
                        case 'TRAIN_MODEL':
                            await TrainingService.runTrainingJob(job);
                            break;
                        default:
                            console.warn(`[Worker] Unknown job type: ${job.job_type}`);
                    }

                    await QueueService.completeJob(job.id);
                    console.log(`[Worker] Job ${job.id} completed.`);
                } catch (err) {
                    console.error(`[Worker] Job ${job.id} failed:`, err);
                    await QueueService.failJob(job.id, err.message);
                }
            } else {
                // No jobs, wait before polling again
                // console.log('[Worker] No jobs, waiting...');
            }
        } catch (error) {
            console.error('[Worker] Error in worker loop:', error);
        }

        // Wait before next poll
        await new Promise(resolve => setTimeout(resolve, POLL_INTERVAL));
    }
}

// Handle shutdown
process.on('SIGINT', () => {
    console.log('[Worker] Shutting down...');
    process.exit(0);
});

startWorker();
