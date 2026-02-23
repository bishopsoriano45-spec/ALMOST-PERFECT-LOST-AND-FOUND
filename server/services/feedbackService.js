const { pool } = require('../db/db');

async function createFeedback(data) {
    const { userEmail, userName, message, type } = data;
    const client = await pool.connect();
    try {
        const query = `
            INSERT INTO feedback (user_email, user_name, message, type)
            VALUES ($1, $2, $3, $4)
            RETURNING *
        `;
        const res = await client.query(query, [userEmail, userName, message, type || 'complaint']);
        return res.rows[0];
    } finally {
        client.release();
    }
}

async function getAllFeedback() {
    const client = await pool.connect();
    try {
        const query = 'SELECT * FROM feedback ORDER BY created_at DESC';
        const res = await client.query(query);
        return res.rows;
    } finally {
        client.release();
    }
}

async function updateFeedbackStatus(id, status) {
    const client = await pool.connect();
    try {
        const query = 'UPDATE feedback SET status = $1 WHERE id = $2 RETURNING *';
        const res = await client.query(query, [status, id]);
        return res.rows[0];
    } finally {
        client.release();
    }
}

module.exports = {
    createFeedback,
    getAllFeedback,
    updateFeedbackStatus
};
