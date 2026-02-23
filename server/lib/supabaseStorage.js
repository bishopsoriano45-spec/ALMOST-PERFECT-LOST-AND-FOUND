const { createClient } = require('@supabase/supabase-js');
const path = require('path');

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY; // service_role key - bypasses RLS

console.log('Supabase Storage init - URL:', SUPABASE_URL ? 'SET' : 'MISSING');
console.log('Supabase Storage init - SERVICE KEY:', SUPABASE_SERVICE_KEY ? 'SET (length: ' + SUPABASE_SERVICE_KEY.length + ')' : 'MISSING');

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

const BUCKET = 'item-images';

// Verify bucket exists on startup
supabase.storage.listBuckets().then(({ data, error }) => {
    if (error) {
        console.error('Supabase Storage - Failed to list buckets:', error.message);
    } else {
        const bucketNames = data.map(b => b.name);
        console.log('Supabase Storage - Available buckets:', bucketNames);
        if (!bucketNames.includes(BUCKET)) {
            console.error(`Supabase Storage - WARNING: Bucket "${BUCKET}" not found! Create it in Supabase dashboard -> Storage`);
        } else {
            console.log(`Supabase Storage - Bucket "${BUCKET}" found and ready`);
        }
    }
});

/**
 * Upload a file buffer to Supabase Storage
 */
async function uploadImage(buffer, originalName, mimetype) {
    const ext = path.extname(originalName) || '.jpg';
    const filename = `${Date.now()}${ext}`;

    console.log(`Supabase upload: ${filename} (${mimetype}, ${buffer.length} bytes)`);

    const { data, error } = await supabase.storage
        .from(BUCKET)
        .upload(filename, buffer, {
            contentType: mimetype,
            upsert: false
        });

    if (error) {
        console.error('Supabase upload error details:', JSON.stringify(error));
        throw new Error(`Supabase upload failed: ${error.message}`);
    }

    console.log('Supabase upload success:', data.path);

    const { data: urlData } = supabase.storage
        .from(BUCKET)
        .getPublicUrl(filename);

    console.log('Supabase public URL:', urlData.publicUrl);
    return urlData.publicUrl;
}

module.exports = { uploadImage };
