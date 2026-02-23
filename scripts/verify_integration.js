import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Colors for console output
const colors = {
    reset: "\x1b[0m",
    red: "\x1b[31m",
    green: "\x1b[32m",
    yellow: "\x1b[33m",
    cyan: "\x1b[36m"
};

const log = (msg, color = colors.reset) => console.log(`${color}${msg}${colors.reset}`);

async function verify() {
    log("Starting Integration Verification...", colors.cyan);

    // 1. Check Backend Health
    try {
        log("\nChecking Backend Server (http://localhost:3000)...");
        const backendRes = await fetch('http://localhost:3000/');
        if (backendRes.ok) {
            log("✓ Backend is UP", colors.green);
        } else {
            throw new Error(`Backend returned ${backendRes.status}`);
        }
    } catch (e) {
        log(`✗ Backend is DOWN: ${e.message}`, colors.red);
        log("Please start the backend server: cd server && npm start", colors.yellow);
    }

    // 2. Check AI Service Health
    try {
        log("\nChecking AI Server (http://localhost:8000)...");
        const aiRes = await fetch('http://localhost:8000/');
        if (aiRes.ok) {
            log("✓ AI Service is UP", colors.green);
        } else {
            throw new Error(`AI Service returned ${aiRes.status}`);
        }
    } catch (e) {
        log(`✗ AI Service is DOWN: ${e.message}`, colors.red);
        log("Please start the AI service: cd ai_service && uvicorn main:app --port 8000", colors.yellow);
    }

    // 3. Test Proxy Detection (Backend -> AI)
    try {
        log("\nTesting AI Detection Proxy (POST http://localhost:3000/api/ai/detect)...");

        // Create a dummy image file if needed or use an existing one
        const testImagePath = path.join(__dirname, 'test_image.jpg');
        if (!fs.existsSync(testImagePath)) {
            // Create a simple text file acting as image for test if we don't have one, 
            // but AI service might fail to open it as image.
            // Better to skip if no image.
            log("⚠ No test_image.jpg found in scripts/ folder. Skipping actual detection test.", colors.yellow);
            // We can try to download one or just skip.
        } else {
            // If we had an image, we would upload it here.
            // For now, let's just log that we need an image to test.
        }
    } catch (e) {
        log(`✗ Proxy Test Failed: ${e.message}`, colors.red);
    }
}

verify();
