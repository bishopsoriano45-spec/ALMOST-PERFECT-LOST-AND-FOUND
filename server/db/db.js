const { Pool } = require('pg');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });

// PostgreSQL connection pool
const pool = new Pool({
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 5432,
    database: process.env.DB_NAME || 'lost_found',
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD,
    max: 20,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 2000,
});

// Test connection
pool.on('connect', () => {
    console.log('Connected to PostgreSQL database');
});

// FIX: Don't crash server on DB errors - let connection pool handle reconnection
pool.on('error', (err) => {
    console.error('Unexpected error on idle PostgreSQL client', err);
    console.error('Connection pool will attempt to reconnect...');
    // Removed process.exit(-1) to allow graceful recovery
});

// ============================================================================
// SQLite-Compatible Adapter for PostgreSQL
// ============================================================================

/**
 * Convert SQLite placeholders (?) to PostgreSQL placeholders ($1, $2, etc.)
 */
function convertPlaceholders(sql) {
    let index = 1;
    return sql.replace(/\?/g, () => `$${index++}`);
}

/**
 * db.run() - Execute INSERT, UPDATE, DELETE queries
 * SQLite signature: db.run(sql, params, callback(err))
 * PostgreSQL equivalent: pool.query()
 */
function run(sql, params, callback) {
    const pgSql = convertPlaceholders(sql);

    pool.query(pgSql, params, (err, result) => {
        if (err) {
            return callback(err);
        }

        // For INSERT queries with RETURNING clause, get the returned ID
        // For other queries, lastID will be null
        let lastID = null;

        if (result.rows && result.rows.length > 0 && result.rows[0].id !== undefined) {
            lastID = result.rows[0].id;
        }

        // Mimic SQLite's this context
        const context = {
            lastID: lastID,
            changes: result.rowCount || 0
        };

        callback.call(context, null);
    });
}

/**
 * db.get() - Execute SELECT query and return single row
 * SQLite signature: db.get(sql, params, callback(err, row))
 * PostgreSQL equivalent: pool.query() with rows[0]
 */
function get(sql, params, callback) {
    const pgSql = convertPlaceholders(sql);

    pool.query(pgSql, params, (err, result) => {
        if (err) {
            return callback(err);
        }

        // Return first row or undefined
        callback(null, result.rows[0]);
    });
}

/**
 * db.all() - Execute SELECT query and return all rows
 * SQLite signature: db.all(sql, params, callback(err, rows))
 * PostgreSQL equivalent: pool.query() with rows
 */
function all(sql, params, callback) {
    const pgSql = convertPlaceholders(sql);

    pool.query(pgSql, params, (err, result) => {
        if (err) {
            return callback(err);
        }

        // Return all rows
        callback(null, result.rows);
    });
}

/**
 * db.exec() - Execute raw SQL (for schema creation)
 * SQLite signature: db.exec(sql, callback(err))
 * PostgreSQL equivalent: pool.query()
 */
function exec(sql, callback) {
    pool.query(sql, (err, result) => {
        if (err) {
            return callback(err);
        }
        callback(null);
    });
}

// Export SQLite-compatible interface
module.exports = {
    run,
    get,
    all,
    exec,
    query: (text, params) => pool.query(text, params),
    getClient: () => pool.connect(),
    pool
};
