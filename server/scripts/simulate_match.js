
const db = require('../db/db');
const matchingService = require('../services/matchingService');
const notificationService = require('../services/notificationService');

async function testMatching() {
    console.log("Starting Matching System Test...");

    // 1. Create a dummy Lost Item
    const lostItemData = {
        title: "Test Lost iPhone 15",
        description: "Black iPhone 15 Pro, lost near the library. Has a cracked screen protector.",
        category: "electronics",
        location: "Library - Main Floor",
        date_lost: new Date().toISOString(),
        user_id: 1, // Ensure this user exists or use a valid ID if relational constraints exist
        contact_email: "lost_user@test.com",
        // Dummy embedding for visual match (randomized but consistent)
        embedding: JSON.stringify(Array(512).fill(0.1))
    };

    console.log("Creating Test Lost Item...");

    // We need to insert this into DB to get an ID
    const insertLostSql = `
        INSERT INTO lost_items (user_id, title, description, category, location, date_lost, contact_email, embedding, status)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 'active')
        RETURNING id
    `;

    // Use a Promise wrapper for db.run/get since we are outside express
    const runQuery = (sql, params) => new Promise((resolve, reject) => {
        db.pool.query(sql, params, (err, result) => {
            if (err) reject(err);
            else resolve(result.rows[0]);
        });
    });

    try {
        const lostResult = await runQuery(insertLostSql, [
            lostItemData.user_id, lostItemData.title, lostItemData.description,
            lostItemData.category, lostItemData.location, lostItemData.date_lost,
            lostItemData.contact_email, lostItemData.embedding
        ]);

        const lostId = lostResult.id;
        console.log(`Created Lost Item ID: ${lostId}`);

        // 2. Mock a Found Item (In-memory is fine for findPotentialMatches, but let's insert to be safe if queries rely on table)
        // Actually findPotentialMatches takes "newItem" which is the object, and queries the *opposite* table.
        // So we need to query LOST table (which we just inserted into) using a FOUND item object.

        const foundItem = {
            id: 9999, // Temporary ID
            type: 'found',
            title: "Found Black iPhone",
            description: "Found an iPhone 15 Pro with cracked screen near library entrance.",
            category: "electronics",
            location: "Library - Main Floor",
            date_found: new Date().toISOString(),
            user_id: 2,
            contact_email: "finder@test.com",
            // Same embedding => High visual match
            embedding: JSON.stringify(Array(512).fill(0.1))
        };

        console.log("Simulating Match Search for Found Item...");

        // 3. Run Matching Logic
        const matches = await matchingService.findPotentialMatches(foundItem, 'found');

        console.log(`\nPotential Matches Found: ${matches.length}`);

        if (matches.length > 0) {
            const topMatch = matches[0];
            console.log("\nTop Match Details:");
            console.log(`- Item ID: ${topMatch.item.id}`);
            console.log(`- Score: ${topMatch.matchScore} (Threshold: 0.6)`);
            console.log(`- Visual Score: ${topMatch.details.visualSimilarity}`);
            console.log(`- Explanation: ${topMatch.explanation.join(', ')}`);

            if (topMatch.matchScore >= 0.6) {
                console.log("\nSUCCESS: Match score exceeds threshold.");
            } else {
                console.log("\nFAILURE: Match score too low.");
            }

            // 4. Test Notification Trigger (Mocked)
            console.log("\nSimulating Notification Trigger...");
            // We won't actually call createMatchNotification to avoid spamming real emails if configured,
            // unless the user wants us to. But we can verify the data structure.

            console.log(`Would send email to: ${topMatch.item.contact_email} (User ID: ${topMatch.item.userId})`);

        } else {
            console.log("\nFAILURE: No matches found (expected at least one).");
        }

        // Cleanup
        await runQuery("DELETE FROM lost_items WHERE id = $1", [lostId]);
        console.log("\nTest Data Cleaned Up.");

    } catch (err) {
        console.error("Test Failed:", err);
    } finally {
        process.exit();
    }
}

testMatching();
