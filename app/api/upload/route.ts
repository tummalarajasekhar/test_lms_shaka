import { NextRequest, NextResponse } from 'next/server';
import { S3Client } from '@aws-sdk/client-s3';
import { Upload } from '@aws-sdk/lib-storage';
import { exec } from 'child_process';
import fs from 'fs';
import path from 'path';
import { promisify } from 'util';
import { v4 as uuidv4 } from 'uuid';
import pool from '@/lib/db'; // Your Postgres connection

const execAsync = promisify(exec);

// Cloudflare R2 Configuration
const r2 = new S3Client({
    region: 'auto',
    endpoint: `https://${process.env.CLOUDFLARE_ACCOUNT_ID}.r2.cloudflarestorage.com`,
    credentials: {
        accessKeyId: process.env.R2_ACCESS_KEY_ID!,
        secretAccessKey: process.env.R2_SECRET_ACCESS_KEY!,
    },
});

export async function POST(req: NextRequest) {
    // Define temp paths outside try/catch for cleanup in 'finally' block
    let tempDir = "";

    try {
        const formData = await req.formData();
        const file = formData.get('video') as File;

        // 1. Check Packager Path (Double check your .env uses double slashes!)
        const PACKAGER_PATH = process.env.PACKAGER_PATH;
        if (!PACKAGER_PATH || !fs.existsSync(PACKAGER_PATH)) {
            return NextResponse.json({ error: 'Packager not found. Check PACKAGER_PATH in .env' }, { status: 500 });
        }

        if (!file) return NextResponse.json({ error: 'No file found' }, { status: 400 });

        // 2. Setup Temp Folders
        const videoId = uuidv4();
        tempDir = path.join(process.cwd(), 'temp', videoId);
        const inputPath = path.join(tempDir, 'input.mp4');
        const outputPath = path.join(tempDir, 'output');

        fs.mkdirSync(tempDir, { recursive: true });
        fs.mkdirSync(outputPath, { recursive: true });

        // 3. Write Raw File to Disk
        const buffer = Buffer.from(await file.arrayBuffer());
        fs.writeFileSync(inputPath, buffer);

        // 4. Generate Encryption Keys
        const keyId = uuidv4().replace(/-/g, '');
        const key = uuidv4().replace(/-/g, '');

        console.log("🔐 Encrypting video...");

        // 5. Run Packager (With Smart Retry Logic)

        // Command A: Expects Audio + Video (Standard)
        const cmdWithAudio = `"${PACKAGER_PATH}" \
      input="${inputPath}",stream=audio,output="${outputPath}/audio.mp4" \
      input="${inputPath}",stream=video,output="${outputPath}/video.mp4" \
      --enable_raw_key_encryption \
      --keys label=:key_id=${keyId}:key=${key} \
      --mpd_output "${outputPath}/manifest.mpd"`;

        // Command B: Video Only (Fallback for silent videos)
        const cmdVideoOnly = `"${PACKAGER_PATH}" \
      input="${inputPath}",stream=video,output="${outputPath}/video.mp4" \
      --enable_raw_key_encryption \
      --keys label=:key_id=${keyId}:key=${key} \
      --mpd_output "${outputPath}/manifest.mpd"`;

        try {
            // Try the standard way first
            await execAsync(cmdWithAudio);
        } catch (error: any) {
            // Check if it failed because audio is missing
            const stderr = error.stderr || "";
            if (stderr.includes("stream=audio not available") || stderr.includes("Stream not available")) {
                console.warn("⚠️ No audio track found. Retrying with video-only mode...");
                await execAsync(cmdVideoOnly);
            } else {
                // If it's a different error, crash properly
                throw error;
            }
        }

        console.log("✅ Encryption done. Uploading to Cloudflare...");

        // 6. Upload All Generated Files to Cloudflare
        const files = fs.readdirSync(outputPath);
        for (const fileName of files) {
            const fileStream = fs.createReadStream(path.join(outputPath, fileName));
            const upload = new Upload({
                client: r2,
                params: {
                    Bucket: process.env.R2_BUCKET_NAME,
                    Key: `${videoId}/${fileName}`,
                    Body: fileStream,
                    ContentType: fileName.endsWith('.mpd') ? 'application/dash+xml' : 'video/mp4'
                },
            });
            await upload.done();
        }

        // 7. Save to Neon DB (Postgres)
        const manifestUrl = `${process.env.R2_PUBLIC_URL}/${videoId}/manifest.mpd`;

        const query = `
      INSERT INTO videos (id, title, manifest_url, key_id, key_secret)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING *
    `;

        const values = [videoId, file.name, manifestUrl, keyId, key];
        const result = await pool.query(query, values);

        return NextResponse.json({
            success: true,
            video: result.rows[0]
        });

    } catch (error: any) {
        console.error("Upload Error:", error);
        return NextResponse.json({ error: error.message || 'Upload failed' }, { status: 500 });
    } finally {
        // 8. Cleanup Temp Files (Always runs)
        if (tempDir && fs.existsSync(tempDir)) {
            fs.rmSync(tempDir, { recursive: true, force: true });
        }
    }
}