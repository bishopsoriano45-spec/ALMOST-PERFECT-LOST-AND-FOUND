const { pool } = require('../db/db');
const crypto = require('crypto');

/**
 * Authentication Service
 * Handles user registration and basic auth
 */

// Simple hashing for demo purposes (Use bcrypt in production)
const hashPassword = (password) => {
    return crypto.createHash('sha256').update(password).digest('hex');
};

/**
 * Register a new user
 * Enforce @gmail.com domain
 */
async function registerUser(email, password, name) {
    if (!email.endsWith('@gmail.com')) {
        throw new Error('Only @gmail.com addresses are allowed.');
    }

    const client = await pool.connect();
    try {
        // Check if user exists
        const checkRes = await client.query('SELECT * FROM users WHERE email = $1', [email]);
        if (checkRes.rows.length > 0) {
            throw new Error('User already exists');
        }

        const userId = 'user_' + Date.now();
        const hashedPassword = hashPassword(password);

        const query = `
            INSERT INTO users (user_id, email, password_hash, role, points, created_at)
            VALUES ($1, $2, $3, 'user', 0, NOW())
            RETURNING user_id, email, role, points, created_at
        `;

        const res = await client.query(query, [userId, email, hashedPassword]);
        return res.rows[0];
    } finally {
        client.release();
    }
}

/**
 * Login user
 */
async function loginUser(email, password) {
    const client = await pool.connect();
    try {
        const res = await client.query('SELECT * FROM users WHERE email = $1', [email]);
        if (res.rows.length === 0) {
            throw new Error('Invalid email or password');
        }

        const user = res.rows[0];
        const hashedPassword = hashPassword(password);

        if (user.password_hash !== hashedPassword) {
            throw new Error('Invalid email or password');
        }

        // Return user info without password hash
        const { password_hash, ...userInfo } = user;
        return userInfo;
    } finally {
        client.release();
    }
}

module.exports = {
    registerUser,
    loginUser
};
