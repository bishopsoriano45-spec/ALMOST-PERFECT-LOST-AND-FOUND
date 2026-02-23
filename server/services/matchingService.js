const db = require('../db/db');

/**
 * Matching Service - Finds potential matches between lost and found items
 */

/**
 * Calculate cosine similarity between two embedding vectors
 */
function cosineSimilarity(vec1, vec2) {
    if (!vec1 || !vec2 || vec1.length !== vec2.length) {
        return 0;
    }

    let dotProduct = 0;
    let norm1 = 0;
    let norm2 = 0;

    for (let i = 0; i < vec1.length; i++) {
        dotProduct += vec1[i] * vec2[i];
        norm1 += vec1[i] * vec1[i];
        norm2 += vec2[i] * vec2[i];
    }

    const magnitude = Math.sqrt(norm1) * Math.sqrt(norm2);
    return magnitude === 0 ? 0 : dotProduct / magnitude;
}

/**
 * Calculate text similarity using simple word overlap
 */
function textSimilarity(text1, text2) {
    if (!text1 || !text2) return 0;

    const words1 = text1.toLowerCase().split(/\s+/).filter(w => w.length > 2);
    const words2 = text2.toLowerCase().split(/\s+/).filter(w => w.length > 2);

    const set1 = new Set(words1);
    const set2 = new Set(words2);

    const intersection = new Set([...set1].filter(x => set2.has(x)));
    const union = new Set([...set1, ...set2]);

    return union.size === 0 ? 0 : intersection.size / union.size;
}

/**
 * Calculate location proximity score (0-1)
 * For now, simple string matching. Can be enhanced with geocoding.
 */
function locationProximity(loc1, loc2) {
    if (!loc1 || !loc2) return 0;

    const l1 = loc1.toLowerCase().trim();
    const l2 = loc2.toLowerCase().trim();

    if (l1 === l2) return 1.0;
    if (l1.includes(l2) || l2.includes(l1)) return 0.7;

    // Check for common words
    const words1 = l1.split(/\s+/);
    const words2 = l2.split(/\s+/);
    const commonWords = words1.filter(w => words2.includes(w));

    return commonWords.length > 0 ? 0.4 : 0;
}

/**
 * Calculate date relevance (0-1)
 * Items reported closer in time are more relevant
 */
function dateRelevance(date1, date2) {
    if (!date1 || !date2) return 0.5;

    const d1 = new Date(date1);
    const d2 = new Date(date2);
    const diffDays = Math.abs((d1 - d2) / (1000 * 60 * 60 * 24));

    // Full score if within 7 days, decreasing after
    if (diffDays <= 7) return 1.0;
    if (diffDays <= 14) return 0.8;
    if (diffDays <= 30) return 0.6;
    if (diffDays <= 60) return 0.4;
    return 0.2;
}

/**
 * Calculate overall match score between two items
 */
function calculateMatchScore(item1, item2) {
    // Parse embeddings if they're strings
    let embedding1 = item1.embedding;
    let embedding2 = item2.embedding;

    if (typeof embedding1 === 'string') {
        try {
            embedding1 = JSON.parse(embedding1);
        } catch (e) {
            embedding1 = null;
        }
    }

    if (typeof embedding2 === 'string') {
        try {
            embedding2 = JSON.parse(embedding2);
        } catch (e) {
            embedding2 = null;
        }
    }

    // Calculate individual scores
    const hasEmbeddings = embedding1 && embedding2;
    const visualSimilarity = hasEmbeddings ? cosineSimilarity(embedding1, embedding2) : 0;
    const categoryMatch = item1.category === item2.category ? 1.0 : 0;
    const locationScore = locationProximity(item1.location, item2.location);
    const dateScore = dateRelevance(item1.date_lost || item1.date_found, item2.date_lost || item2.date_found);
    const titleScore = textSimilarity(item1.title, item2.title);
    const descriptionScore = textSimilarity(item1.description, item2.description);

    // Calculate final match score
    // If embeddings exist, use visual-weighted formula. Otherwise, use text-based matching.
    let matchScore;
    if (hasEmbeddings) {
        // Visual-first matching (for items with AI embeddings)
        matchScore = (
            visualSimilarity * 0.60 +
            categoryMatch * 0.15 +
            locationScore * 0.10 +
            dateScore * 0.10 +
            descriptionScore * 0.05
        );
    } else {
        // Text-based matching (no embeddings - fallback mode)
        matchScore = (
            titleScore * 0.35 +  // Title is very important
            categoryMatch * 0.25 +  // Category matters
            descriptionScore * 0.20 +  // Description helps
            locationScore * 0.15 +  // Location is helpful
            dateScore * 0.05  // Date is less important for text matching
        );
    }

    // HYBRID BOOST: If visual similarity is very high (> 85%), assume it's the same item
    // even if the user botched the category or description.
    if (visualSimilarity > 0.85) {
        matchScore = Math.max(matchScore, visualSimilarity);
    }

    // Generate explanation
    const explanation = [];
    if (visualSimilarity > 0.85) explanation.push('Exact visual match detected');
    else if (visualSimilarity > 0.7) explanation.push('High visual similarity');

    if (titleScore > 0.5) explanation.push('Similar title');
    if (categoryMatch) explanation.push('Same category');
    if (locationScore > 0.6) explanation.push('Similar location');
    if (dateScore > 0.8) explanation.push('Reported around the same time');
    if (descriptionScore > 0.5) explanation.push('Similar description');

    return {
        score: matchScore,
        visualSimilarity,
        categoryMatch: categoryMatch ? 1.0 : 0,
        locationScore,
        dateScore,
        descriptionScore,
        titleScore,
        explanation
    };
}

/**
 * Find potential matches for a newly reported item
 * @param {Object} newItem - The newly reported item
 * @param {string} itemType - 'lost' or 'found'
 * @param {number} threshold - Minimum match score (default: 0.6)
 * @returns {Promise<Array>} Array of potential matches with scores
 */
async function findPotentialMatches(newItem, itemType, threshold = 0.6) {
    return new Promise((resolve, reject) => {
        // Search in the opposite table
        const searchTable = itemType === 'lost' ? 'found_items' : 'lost_items';
        const searchType = itemType === 'lost' ? 'found' : 'lost';

        // Get all open/active items from the opposite table
        const sql = `SELECT * FROM ${searchTable} WHERE status IN ('open', 'active')`;

        db.all(sql, [], (err, rows) => {
            if (err) {
                return reject(err);
            }

            const matches = [];

            for (const row of rows) {
                const matchResult = calculateMatchScore(newItem, row);

                if (matchResult.score >= threshold) {
                    matches.push({
                        item: {
                            id: `${searchType}_${row.id}`,
                            dbId: row.id,
                            type: searchType,
                            title: row.title,
                            description: row.description,
                            category: row.category,
                            location: row.location,
                            dateReported: searchType === 'lost' ? row.date_lost : row.date_found,
                            imageUrl: row.image_path ? (() => {
                                const normalizedPath = row.image_path.replace(/\\/g, '/');
                                const uploadsIndex = normalizedPath.indexOf('uploads/');
                                const filename = uploadsIndex !== -1
                                    ? normalizedPath.substring(uploadsIndex + 8)
                                    : normalizedPath.split('/').pop();
                                const baseUrl = process.env.BASE_URL || 'http://localhost:3000';
                                return `${baseUrl}/uploads/${filename}`;
                            })() : null,
                            userId: row.user_id,
                            contact_email: row.contact_email,
                            contact_phone: row.contact_phone
                        },
                        matchScore: matchResult.score,
                        details: {
                            visualSimilarity: matchResult.visualSimilarity,
                            categoryMatch: matchResult.categoryMatch,
                            locationScore: matchResult.locationScore,
                            dateScore: matchResult.dateScore,
                            descriptionScore: matchResult.descriptionScore
                        },
                        explanation: matchResult.explanation,
                        confidence: matchResult.score >= 0.8 ? 'high' : matchResult.score >= 0.7 ? 'medium' : 'low'
                    });
                }
            }

            // Sort by match score (highest first)
            matches.sort((a, b) => b.matchScore - a.matchScore);

            resolve(matches);
        });
    });
}

module.exports = {
    findPotentialMatches,
    calculateMatchScore,
    cosineSimilarity,
    textSimilarity,
    locationProximity,
    dateRelevance
};
