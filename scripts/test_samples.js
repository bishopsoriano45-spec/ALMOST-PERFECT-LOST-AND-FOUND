import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function testImages() {
    const samplesDir = path.join(__dirname, '../server/sample_images');

    if (!fs.existsSync(samplesDir)) {
        console.log("Sample directory not found");
        return;
    }

    const files = fs.readdirSync(samplesDir).filter(f => f.endsWith('.jpg') || f.endsWith('.png'));

    console.log(`Found ${files.length} images to test.`);

    for (const file of files) {
        console.log(`\nTesting ${file}...`);
        const filePath = path.join(samplesDir, file);
        const blob = new Blob([fs.readFileSync(filePath)]);
        const formData = new FormData();
        formData.append('image', blob, file);

        try {
            const res = await fetch('http://localhost:3000/api/ai/detect', {
                method: 'POST',
                body: formData
            });

            if (!res.ok) {
                const errData = await res.json();
                console.error(`Error ${res.status}:`, errData);
                continue;
            }

            const data = await res.json();

            if (data.detections && data.detections.length > 0) {
                // Sort by confidence
                const best = data.detections.sort((a, b) => b.confidence - a.confidence)[0];
                console.log(`✓ Detected: ${best.class} (Confidence: ${(best.confidence * 100).toFixed(1)}%)`);

                // Simulate the frontend mapping logic briefly here to show user what it WOULD be
                const lowerClass = best.class.toLowerCase();
                let category = 'unknown';
                if (['cell phone', 'laptop', 'tv', 'remote'].includes(lowerClass)) category = 'electronics';
                else if (lowerClass.includes('phone')) category = 'electronics';

                console.log(`  -> Mapped Category: ${category}`);
            } else {
                console.log("✗ No objects detected");
            }
        } catch (err) {
            console.error("Error:", err.message);
        }
    }
}

testImages();
