const axios = require('axios');

async function testComparison() {
    const url = 'http://localhost:5000/compare'; // Hit AI service directly

    // CASE 1: MATCH (High Confidence)
    const matchCase = {
        lost_item: {
            category: "electronics",
            object_type: "smartphone",
            features: ["black case", "cracked screen", "dual camera"],
            brand: "Apple",
            colors: ["black"],
            location: "Library",
            date: "2023-10-26"
        },
        found_item: {
            category: "electronics",
            object_type: "smartphone",
            features: ["black otterbox", "cracked front glass", "2 cameras"],
            brand: "Apple",
            colors: ["black"],
            location: "Library Main Desk",
            date: "2023-10-27"
        }
    };

    // CASE 2: MISMATCH (Different Object Type)
    const mismatchCase = {
        lost_item: {
            category: "electronics",
            object_type: "smartphone",
            features: ["blue case"],
            brand: "Samsung"
        },
        found_item: {
            category: "electronics",
            object_type: "laptop",
            features: ["silver"],
            brand: "Dell"
        }
    };

    try {
        console.log("🚀 Testing MATCH Case...");
        const res1 = await axios.post(url, matchCase);
        console.log("✅ Match Result:", JSON.stringify(res1.data, null, 2));

        console.log("\n🚀 Testing MISMATCH Case...");
        const res2 = await axios.post(url, mismatchCase);
        console.log("✅ Mismatch Result:", JSON.stringify(res2.data, null, 2));

    } catch (error) {
        console.error("❌ Comparison Test Failed:", error.message);
        if (error.response) {
            console.log("Response:", error.response.data);
        }
    }
}

testComparison();
