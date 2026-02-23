const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const db = require('../db/db');
const matchingService = require('../services/matchingService');
const notificationService = require('../services/notificationService');
const { uploadImage } = require('../lib/supabaseStorage');

// Helper to map DB row to Item interface
const mapDbRowToItem = (row) => {
    if (!row) return null;
    // The 'type' field should be explicitly selected in the SQL query (e.g., 'lost' as type)
    const items_type = row.type;

    if (!items_type) {
        // Fallback or warning
        console.warn("mapDbRowToItem called without 'type' in row:", row);
        return null;
    }

    const dbId = row.id;

    return {
        id: `${items_type}_${dbId}`, // Prefix ID
        type: items_type,
        title: row.title,
        description: row.description,
        category: row.category,
        location: { name: row.location }, // DB has string, Frontend expects object
        dateReported: (() => {
            const rawDate = row.date_reported || (items_type === 'lost' ? row.date_lost : row.date_found) || row.created_at;
            if (!rawDate) return new Date().toISOString();
            // PostgreSQL DATE type returns JS Date objects - convert to ISO string
            if (rawDate instanceof Date) return rawDate.toISOString();
            return rawDate;
        })(),
        imageUrl: (() => {
            if (!row.image_path) return null;
            // If it's already a full URL (Supabase), return as-is
            if (row.image_path.startsWith('http')) return row.image_path;
            // Legacy local path: extract filename
            const normalizedPath = row.image_path.replace(/\\/g, '/');
            const filename = normalizedPath.split('/').pop();
            return `/uploads/${filename}`;
        })(),
        status: row.status || 'active',
        tags: row.tags ? (typeof row.tags === 'string' ? JSON.parse(row.tags || '[]') : row.tags) : [],
        contactInfo: {
            name: row.contact_email ? row.contact_email.split('@')[0] : row.user_id || 'Anonymous',
            email: row.contact_email || 'user' + row.user_id + '@example.com'
        },
        qrCode: row.qr_code || null,
        createdAt: row.created_at instanceof Date ? row.created_at.toISOString() : row.created_at,
        updatedAt: row.updated_at instanceof Date ? row.updated_at.toISOString() : row.updated_at
    };
};

// Configure Multer to use memory storage (for Supabase upload)
const upload = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
    fileFilter: (req, file, cb) => {
        const filetypes = /jpeg|jpg|png|webp/;
        const mimetype = filetypes.test(file.mimetype);
        const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
        if (mimetype && extname) {
            return cb(null, true);
        }
        cb(new Error('File upload only supports: jpeg, jpg, png, webp'));
    }
});

// POST /api/items/lost - Report a lost item
router.post('/lost', upload.single('image'), async (req, res) => {
    const { title, description, category, location, date_lost, user_id, tags, embedding, ai_metadata, contact_email, contact_phone } = req.body;
    console.log('DEBUG /lost: user_id received:', user_id);
    let image_path = null;
    if (req.file) {
        try {
            image_path = await uploadImage(req.file.buffer, req.file.originalname, req.file.mimetype);
        } catch (uploadErr) {
            console.error('Supabase upload error:', uploadErr);
        }
    }

    let detection_label = null;
    let confidence_score = null;
    if (ai_metadata) {
        try {
            const parsedMeta = typeof ai_metadata === 'string' ? JSON.parse(ai_metadata) : ai_metadata;
            detection_label = parsedMeta.category;
            confidence_score = parsedMeta.confidence;
        } catch (e) { console.error("Error parsing ai_metadata", e); }
    }

    // Ensure guest user exists or use NULL
    let finalUserId = user_id || 'guest';

    if (finalUserId === 'guest') {
        await new Promise((resolve) => {
            db.run(`INSERT INTO users (user_id, email, role, points) VALUES (?, ?, 'user', 0) ON CONFLICT (user_id) DO NOTHING`,
                ['guest', 'guest@example.com'], (createErr) => {
                    if (createErr) console.error('Error creating guest user:', createErr);
                    resolve();
                });
        });
    }

    const sql = `INSERT INTO lost_items (user_id, title, description, category, location, date_lost, image_path, tags, embedding, detection_label, confidence_score, contact_email, contact_phone) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?) RETURNING *`;
    const params = [
        finalUserId,
        title,
        description,
        category,
        location,
        date_lost || new Date().toISOString(),
        image_path,
        tags,
        embedding,
        detection_label,
        confidence_score,
        contact_email,
        contact_phone
    ];

    console.log('Creating lost item with params:', { user_id, title, category, location, has_image: !!image_path });

    db.get(sql, params, async function (err, insertedRow) {
        if (err) {
            console.error('Database error creating lost item:', err);
            return res.status(500).json({ error: err.message });
        }

        if (!insertedRow) {
            console.error('Item not found after creation');
            return res.status(500).json({ error: 'Item created but could not retrieve returning data' });
        }

        const newId = insertedRow.id;
        console.log('Lost item created with ID:', newId);

        // Map it immediately so we can respond quickly, add 'type' which is expected by mapDbRowToItem
        insertedRow.type = 'lost';
        const createdItem = mapDbRowToItem(insertedRow);

        // Perform parallel tasks asynchronously without blocking the response!
        // Generate QR code
        setTimeout(async () => {
            const { generateQRCode } = require('../utils/qrcode');
            const itemId = `lost_${newId}`;
            try {
                const qrCode = await generateQRCode(itemId);
                if (qrCode) {
                    db.run(`UPDATE lost_items SET qr_code = ? WHERE id = ?`, [qrCode, newId], (updateErr) => {
                        if (updateErr) console.error('Failed to save QR code:', updateErr);
                    });
                }
            } catch (qrErr) {
                console.error('Error generating QR code:', qrErr);
            }
        }, 0);

        // AUTO-LEARNING: Create feedback if AI detection differs from user category
        if (detection_label && category && detection_label.toLowerCase() !== category.toLowerCase()) {
            console.log(`[Auto-Learning] AI detected '${detection_label}' but user selected '${category}'. Creating feedback...`);

            const isCorrect = false;
            const feedbackNotes = `User correction: AI detected '${detection_label}' but actual category is '${category}'`;
            const imageUrl = image_path ? `${process.env.BASE_URL || 'http://localhost:3000'}/uploads/${req.file.filename}` : null;

            db.run(`
                INSERT INTO ai_feedback 
                (item_id, image_url, predicted_class, predicted_confidence, actual_class, is_correct, feedback_notes)
                VALUES (?, ?, ?, ?, ?, ?, ?)
            `, [newId, imageUrl, detection_label, confidence_score, category, isCorrect, feedbackNotes], (fbErr) => {
                if (fbErr) {
                    console.error('[Auto-Learning] Error creating feedback:', fbErr);
                } else {
                    console.log('[Auto-Learning] Feedback created successfully for auto-learning');
                }
            });
        }

        // Find potential matches in found items
        try {
            const newIdStr = `lost_${newId}`;
            console.log(`[MATCHING] ITEM CREATED: ${newIdStr}`);
            const matches = await matchingService.findPotentialMatches(insertedRow, 'lost', 0.3);

            if (matches.length > 0) {
                console.log(`[MATCHING] Processing ${matches.length} matches for new item ${newIdStr}`);
                for (const match of matches) {
                    try {
                        // Notify reporter
                        await notificationService.createMatchNotification(
                            insertedRow.user_id,
                            { id: createdItem.id, type: 'lost', title: insertedRow.title },
                            match
                        );
                        // Notify finder
                        await notificationService.createMatchNotification(
                            match.item.userId,
                            {
                                id: match.item.id,
                                type: 'found',
                                title: match.item.title,
                                contact_email: match.item.contact_email
                            },
                            {
                                ...match,
                                item: {
                                    id: createdItem.id,
                                    title: insertedRow.title,
                                    description: insertedRow.description,
                                    category: insertedRow.category,
                                    location: insertedRow.location,
                                    dateReported: insertedRow.date_lost,
                                    imageUrl: createdItem.imageUrl,
                                    userId: insertedRow.user_id,
                                    contactInfo: { email: insertedRow.contact_email }
                                }
                            }
                        );
                    } catch (notifError) {
                        console.error(`[MATCHING] FAILED to notify for match ${match.item.id}:`, notifError);
                    }
                }
            }

            res.status(201).json({
                ...createdItem,
                matchCount: matches.length,
                hasMatches: matches.length > 0,
                matches: matches
            });
        } catch (matchError) {
            console.error('[MATCHING] CRITICAL ERROR:', matchError);
            res.status(201).json(createdItem);
        }
    });
});

// POST /api/items/found - Report a found item
router.post('/found', upload.single('image'), async (req, res) => {
    const { title, description, category, location, date_found, user_id, tags, embedding, ai_metadata, contact_email, contact_phone } = req.body;
    console.log('DEBUG /found: user_id received:', user_id);
    let image_path = null;
    if (req.file) {
        try {
            image_path = await uploadImage(req.file.buffer, req.file.originalname, req.file.mimetype);
        } catch (uploadErr) {
            console.error('Supabase upload error:', uploadErr);
        }
    }

    let detection_label = null;
    let confidence_score = null;
    if (ai_metadata) {
        try {
            const parsedMeta = typeof ai_metadata === 'string' ? JSON.parse(ai_metadata) : ai_metadata;
            detection_label = parsedMeta.category;
            confidence_score = parsedMeta.confidence;
        } catch (e) { console.error("Error parsing ai_metadata", e); }
    }

    // Ensure guest user exists or use NULL
    let finalUserId = user_id || 'guest';

    if (finalUserId === 'guest') {
        await new Promise((resolve) => {
            db.run(`INSERT INTO users (user_id, email, role, points) VALUES (?, ?, 'user', 0) ON CONFLICT (user_id) DO NOTHING`,
                ['guest', 'guest@example.com'], (createErr) => {
                    if (createErr) console.error('Error creating guest user:', createErr);
                    resolve();
                });
        });
    }

    const sql = `INSERT INTO found_items (user_id, title, description, category, location, date_found, image_path, tags, embedding, detection_label, confidence_score, contact_email, contact_phone) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?) RETURNING *`;
    const params = [
        finalUserId,
        title,
        description,
        category,
        location,
        date_found || new Date().toISOString(),
        image_path,
        tags,
        embedding,
        detection_label,
        confidence_score,
        contact_email,
        contact_phone
    ];

    db.get(sql, params, async function (err, insertedRow) {
        if (err) {
            return res.status(500).json({ error: err.message });
        }

        if (!insertedRow) {
            console.error('Item not found after creation (found)');
            return res.status(500).json({ error: 'Item created but could not retrieve returning data' });
        }

        const newId = insertedRow.id;

        // Map it immediately so we can respond quickly, add 'type' which is expected by mapDbRowToItem
        insertedRow.type = 'found';
        const createdItem = mapDbRowToItem(insertedRow);

        // Perform parallel tasks asynchronously without blocking the response!
        // Generate QR code
        setTimeout(async () => {
            const { generateQRCode } = require('../utils/qrcode');
            const itemId = `found_${newId}`;
            const qrCode = await generateQRCode(itemId);

            if (qrCode) {
                db.run(`UPDATE found_items SET qr_code = ? WHERE id = ?`, [qrCode, newId], (updateErr) => {
                    if (updateErr) console.error('Failed to save QR code:', updateErr);
                });
            }
        }, 0);

        // AUTO-LEARNING: Create feedback if AI detection differs from user category
        if (detection_label && category && detection_label.toLowerCase() !== category.toLowerCase()) {
            console.log(`[Auto-Learning] AI detected '${detection_label}' but user selected '${category}'. Creating feedback...`);

            const isCorrect = false;
            const feedbackNotes = `User correction: AI detected '${detection_label}' but actual category is '${category}'`;
            const imageUrl = image_path ? `${process.env.BASE_URL || 'http://localhost:3000'}/uploads/${req.file.filename}` : null;

            db.run(`
                INSERT INTO ai_feedback 
                (item_id, image_url, predicted_class, predicted_confidence, actual_class, is_correct, feedback_notes)
                VALUES (?, ?, ?, ?, ?, ?, ?)
            `, [newId, imageUrl, detection_label, confidence_score, category, isCorrect, feedbackNotes], (fbErr) => {
                if (fbErr) {
                    console.error('[Auto-Learning] Error creating feedback:', fbErr);
                } else {
                    console.log('[Auto-Learning] Feedback created successfully for auto-learning');
                }
            });
        }

        // Award points
        if (user_id && user_id !== 'guest') {
            db.run(`UPDATE users SET points = COALESCE(points, 0) + 1 WHERE user_id = ?`, [user_id], (pointErr) => {
                if (pointErr) console.error('Failed to award points to user:', pointErr);
                else console.log(`1 point awarded to ${user_id}`);
            });
        }

        // Award points
        if (user_id && user_id !== 'guest') {
            db.run(`UPDATE users SET points = COALESCE(points, 0) + 1 WHERE user_id = ?`, [user_id], (pointErr) => {
                if (pointErr) console.error('Failed to award points to user:', pointErr);
                else console.log(`1 point awarded to ${user_id}`);
            });
        }

        // Find matches
        try {
            const newIdStr = `found_${newId}`;
            console.log(`[MATCHING] ITEM CREATED: ${newIdStr}`);
            const matches = await matchingService.findPotentialMatches(insertedRow, 'found', 0.3);

            if (matches.length > 0) {
                console.log(`[MATCHING] Processing ${matches.length} matches for new item ${newIdStr}`);
                for (const match of matches) {
                    try {
                        // Notify finder
                        await notificationService.createMatchNotification(
                            insertedRow.user_id,
                            { id: createdItem.id, type: 'found', title: insertedRow.title },
                            match
                        );
                        // Notify loser
                        await notificationService.createMatchNotification(
                            match.item.userId,
                            {
                                id: match.item.id,
                                type: 'lost',
                                title: match.item.title,
                                contact_email: match.item.contact_email
                            },
                            {
                                ...match,
                                item: {
                                    id: createdItem.id,
                                    title: insertedRow.title,
                                    description: insertedRow.description,
                                    category: insertedRow.category,
                                    location: insertedRow.location,
                                    dateReported: insertedRow.date_found,
                                    imageUrl: createdItem.imageUrl,
                                    userId: insertedRow.user_id,
                                    contactInfo: { email: insertedRow.contact_email }
                                }
                            }
                        );
                    } catch (notifError) {
                        console.error(`[MATCHING] FAILED to notify for match ${match.item.id}:`, notifError);
                    }
                }
            }

            res.status(201).json({
                ...createdItem,
                matchCount: matches.length,
                hasMatches: matches.length > 0,
                matches: matches
            });
        } catch (matchError) {
            console.error('[MATCHING] CRITICAL ERROR:', matchError);
            res.status(201).json(createdItem);
        }
    });
});

// GET /api/items/recent
router.get('/recent', (req, res) => {
    const limit = parseInt(req.query.limit) || 10;
    const sql = `
        SELECT *, 'lost' as type FROM lost_items
        UNION ALL
        SELECT *, 'found' as type FROM found_items
        ORDER BY created_at DESC
        LIMIT ?
    `;

    db.all(sql, [limit], (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        const items = rows.map(row => mapDbRowToItem(row));
        res.json(items);
    });
});

// GET /api/items - Search/All items with ROBUST SQL BUILDER
router.get('/', (req, res) => {
    const { type, status, category, location, query, user_id } = req.query;

    console.log("GET /api/items params:", req.query);

    // Dynamic SQL Builder
    // We select 'lost' items and 'found' items and UNION them.
    // To filter efficiently, we build the conditions for both subqueries or wrap them.
    // Since SQLite UNION can be tricky with WHERE clauses on the result, we'll wrap it.

    // Base query wrapper
    let sql = `
        SELECT * FROM (
            SELECT id, user_id, title, description, category, location, date_lost as date_reported, image_path, status, tags, contact_email, created_at, updated_at, 'lost' as type FROM lost_items
            UNION ALL
            SELECT id, user_id, title, description, category, location, date_found as date_reported, image_path, status, tags, contact_email, created_at, updated_at, 'found' as type FROM found_items
        ) AS all_items
        WHERE 1=1
    `;

    const params = [];

    // 1. Type Filter
    if (type && type !== 'all') {
        sql += " AND type = ?";
        params.push(type);
    }

    // 2. Status Filter
    // Default to 'active', 'open', 'matched', and 'claimed' if not specified.
    // If status='all', we don't add a clause (show everything).
    if (status && status !== 'all') {
        if (status === 'active') {
            // Handle 'open' legacy status if it exists, or just 'active'
            sql += " AND (status = 'active' OR status = 'open' OR status = 'matched')";
        } else {
            sql += " AND status = ?";
            params.push(status);
        }
    } else if (!status) {
        // Default behavior: Show active, open, matched, AND claimed.
        // We only hide 'closed' or 'archived' by default.
        sql += " AND (status = 'active' OR status = 'open' OR status = 'matched' OR status = 'claimed')";
    }

    // 3. Category Filter
    if (category && category !== 'all') {
        sql += " AND category = ?";
        params.push(category);
    }

    // 4. Location Filter (Fuzzy)
    if (location) {
        sql += " AND location LIKE ?";
        params.push(`%${location}%`);
    }

    // 5. User ID Filter
    if (user_id) {
        sql += " AND user_id = ?";
        params.push(user_id);
    }

    // 6. Text Query (Search)
    if (query) {
        sql += " AND (title LIKE ? OR description LIKE ? OR category LIKE ?)";
        const q = `%${query}%`;
        params.push(q, q, q);
    }

    // Order by newest first
    sql += " ORDER BY created_at DESC";

    // Execute
    db.all(sql, params, (err, rows) => {
        if (err) {
            console.error("Database search error:", err);
            return res.status(500).json({ error: err.message });
        }

        console.log("Items returned from DB:", rows.length);

        // Map to Item interface
        const items = rows.map(mapDbRowToItem).filter(i => i !== null);
        res.json(items);
    });
});

// GET /api/items/:id
router.get('/:id', (req, res) => {
    const { id } = req.params;
    const parts = id.split('_');
    if (parts.length !== 2) return res.status(400).json({ error: 'Invalid ID format' });

    const type = parts[0];
    const dbId = parts[1];

    if (type === 'lost') {
        db.get(`SELECT *, 'lost' as type FROM lost_items WHERE id = ?`, [dbId], (err, row) => {
            if (err) return res.status(500).json({ error: err.message });
            if (!row) return res.status(404).json({ error: 'Item not found' });
            res.json(mapDbRowToItem(row));
        });
    } else if (type === 'found') {
        db.get(`SELECT *, 'found' as type FROM found_items WHERE id = ?`, [dbId], (err, row) => {
            if (err) return res.status(500).json({ error: err.message });
            if (!row) return res.status(404).json({ error: 'Item not found' });
            res.json(mapDbRowToItem(row));
        });
    } else {
        res.status(400).json({ error: 'Invalid item type' });
    }
});

// Update & Delete & Contact endpoints...
// (Included for completeness but unchanged for search fix logic)
// Update an item
router.put('/:id', (req, res) => {
    const { id } = req.params;
    const updates = req.body;

    const parts = id.split('_');
    if (parts.length !== 2) return res.status(400).json({ error: 'Invalid ID format' });

    const type = parts[0];
    const dbId = parts[1];
    const table = type === 'lost' ? 'lost_items' : 'found_items';

    const fields = Object.keys(updates).map(key => `${key.replace(/([A-Z])/g, '_$1').toLowerCase()} = ?`);
    const values = Object.values(updates);

    if (fields.length === 0) {
        return res.status(400).json({ error: 'No updates provided' });
    }

    fields.push('updated_at = CURRENT_TIMESTAMP');
    const sql = `UPDATE ${table} SET ${fields.join(', ')} WHERE id = ?`;

    db.run(sql, [...values, dbId], function (err) {
        if (err) return res.status(500).json({ error: 'Failed to update item' });
        if (this.changes === 0) return res.status(404).json({ error: 'Item not found' });

        db.get(`SELECT *, '${type}' as type FROM ${table} WHERE id = ?`, [dbId], (err, row) => {
            if (err) return res.status(500).json({ error: 'Failed to retrieve updated item' });
            res.json(mapDbRowToItem(row));
        });
    });
});

// Delete an item
router.delete('/:id', async (req, res) => {
    const { id } = req.params;
    const parts = id.split('_');
    if (parts.length !== 2) return res.status(400).json({ error: 'Invalid ID format' });

    const type = parts[0];
    const dbId = parts[1];
    const table = type === 'lost' ? 'lost_items' : 'found_items';

    try {
        // Delete related rows first to avoid FK constraint errors
        // Each wrapped in try/catch so missing tables don't block the delete
        const safeDelete = async (sql, params) => {
            try { await db.query(sql, params); } catch (e) { console.warn('Safe delete skipped:', e.message); }
        };

        await safeDelete(`DELETE FROM ai_feedback WHERE item_id = $1`, [dbId]);
        await safeDelete(`DELETE FROM notifications WHERE related_item_id = $1`, [id]);
        await safeDelete(`DELETE FROM claims WHERE lost_item_id = $1 OR found_item_id = $1`, [dbId]);
        // matches table may not exist in all deployments
        await safeDelete(`DELETE FROM matches WHERE lost_item_id = $1 OR found_item_id = $1`, [dbId]);

        // Now delete the item itself
        const result = await db.query(`DELETE FROM ${table} WHERE id = $1`, [dbId]);

        if (result.rowCount === 0) return res.status(404).json({ error: 'Item not found' });
        res.json({ message: 'Item deleted successfully' });
    } catch (err) {
        console.error('Delete item error:', err.message);
        res.status(500).json({ error: 'Failed to delete item', details: err.message });
    }
});

// POST /contact
router.post('/contact', async (req, res) => {
    const { itemId, senderName, senderEmail, message, type } = req.body;
    if (!itemId || !senderName || !senderEmail || !message) {
        return res.status(400).json({ error: 'Missing required fields' });
    }

    const parts = itemId.split('_');
    if (parts.length !== 2) return res.status(400).json({ error: 'Invalid ID format' });

    const itemType = parts[0];
    const dbId = parts[1];
    const table = itemType === 'lost' ? 'lost_items' : 'found_items';

    db.get(`SELECT * FROM ${table} WHERE id = ?`, [dbId], async (err, row) => {
        if (err) return res.status(500).json({ error: err.message });
        if (!row) return res.status(404).json({ error: 'Item not found' });

        const recipientEmail = row.contact_email;
        if (!recipientEmail) return res.status(400).json({ error: 'Item has no contact email' });

        const emailService = require('../services/emailService');
        const subject = type === 'claim' ? `Claim Request: ${row.title}` : `New Message: ${row.title}`;
        const emailText = `Message from ${senderName} (${senderEmail}):\n\n${message}`;

        try {
            await emailService.sendEmail(recipientEmail, subject, emailText, emailText);
            res.json({ success: true });
        } catch (emailErr) {
            console.error('Failed to send contact email:', emailErr);
            res.status(500).json({ error: 'Failed to send message' });
        }
    });
});

module.exports = router;
