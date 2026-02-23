const { pool } = require('../db/db');

class QueueService {
    /**
     * Add a job to the queue
     * @param {string} type - Job type (e.g., 'TRAIN_MODEL')
     * @param {object} payload - Job data
     */
    static async addJob(type, payload = {}) {
        const query = `
            INSERT INTO background_jobs (job_type, payload, status)
            VALUES ($1, $2, 'pending')
            RETURNING id, job_type, status
        `;
        try {
            const result = await pool.query(query, [type, JSON.stringify(payload)]);
            console.log(`[Queue] Job added: ${type} (ID: ${result.rows[0].id})`);
            return result.rows[0];
        } catch (error) {
            console.error('[Queue] Failed to add job:', error);
            throw error;
        }
    }

    /**
     * Get the next pending job
     */
    static async getNextJob() {
        // Atomic update and fetch: Lock the row, update status to 'processing', return it.
        // CTE (Common Table Expression) is useful here.
        const query = `
            WITH next_job AS (
                SELECT id
                FROM background_jobs
                WHERE status = 'pending'
                ORDER BY created_at ASC
                LIMIT 1
                FOR UPDATE SKIP LOCKED
            )
            UPDATE background_jobs
            SET status = 'processing', updated_at = NOW(), attempts = attempts + 1
            FROM next_job
            WHERE background_jobs.id = next_job.id
            RETURNING background_jobs.*
        `;

        try {
            const result = await pool.query(query);
            return result.rows[0]; // Returns undefined if no job found
        } catch (error) {
            console.error('[Queue] Failed to fetch next job:', error);
            return null;
        }
    }

    /**
     * Complete a job
     */
    static async completeJob(id) {
        try {
            await pool.query(
                `UPDATE background_jobs SET status = 'completed', updated_at = NOW() WHERE id = $1`,
                [id]
            );
            console.log(`[Queue] Job completed: ID ${id}`);
        } catch (error) {
            console.error(`[Queue] Failed to complete job ${id}:`, error);
        }
    }

    /**
     * Fail a job
     */
    static async failJob(id, errorMessage) {
        try {
            await pool.query(
                `UPDATE background_jobs SET status = 'failed', updated_at = NOW(), error_message = $1 WHERE id = $2`,
                [errorMessage, id]
            );
            console.error(`[Queue] Job failed: ID ${id} - ${errorMessage}`);
        } catch (error) {
            console.error(`[Queue] Failed to fail job ${id}:`, error);
        }
    }
}

module.exports = QueueService;
