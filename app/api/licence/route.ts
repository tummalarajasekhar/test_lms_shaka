// app/api/license/route.ts
import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';

function hexToBase64Url(hex: string) {
    return Buffer.from(hex, 'hex')
        .toString('base64')
        .replace(/\+/g, '-')
        .replace(/\//g, '_')
        .replace(/=+$/, '');
}

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        console.log("📢 LICENSE REQUEST BODY:", body); // <--- LOG 1

        const requestedKidBase64 = body.kids?.[0];
        if (!requestedKidBase64) {
            console.error("❌ No kids found in body");
            return new NextResponse("No Key ID provided", { status: 400 });
        }

        // Convert Base64url back to Hex
        const requestedKidHex = Buffer.from(requestedKidBase64, 'base64').toString('hex');
        console.log("🔍 LOOKING FOR KEY ID (HEX):", requestedKidHex); // <--- LOG 2

        const query = 'SELECT * FROM videos WHERE key_id = $1';
        const result = await pool.query(query, [requestedKidHex]);
        const video = result.rows[0];

        if (!video) {
            console.error("❌ KEY NOT FOUND IN DB for ID:", requestedKidHex); // <--- LOG 3
            return new NextResponse("Key not found", { status: 404 });
        }

        console.log("✅ KEY FOUND! Sending license..."); // <--- LOG 4

        return NextResponse.json({
            keys: [{
                kty: 'oct',
                k: hexToBase64Url(video.key_secret),
                kid: hexToBase64Url(video.key_id),
            }],
            type: 'temporary'
        });

    } catch (error) {
        console.error("🔥 LICENSE SERVER CRASH:", error); // <--- LOG 5
        return new NextResponse("Internal Server Error", { status: 500 });
    }
}