"use client";
import { useEffect, useRef } from 'react';
import 'shaka-player/dist/controls.css';

const STREAMS = {
    manifestUri: 'https://pub-f3f7b48ee2de4185b812cace3391b2a4.r2.dev/f7a469de-555e-481a-b637-ea13994d2ad4/manifest.mpd',
    clearKeys: {
        'a7a1ba9a35134b18b38c350db6bf58b6': '200baf2fafa84eb3b74ff7482214dc63'
    }
};

export default function Player() {
    const videoRef = useRef<HTMLVideoElement>(null);
    const containerRef = useRef<HTMLDivElement>(null);
    const playerRef = useRef<any>(null); // Store player instance
    const isInitRef = useRef(false); // <--- THE LOCK

    useEffect(() => {
        const initPlayer = async () => {
            // STOP if we already initialized (Prevents Double Load)
            if (isInitRef.current) return;

            // STOP if refs are missing
            if (!videoRef.current || !containerRef.current) {
                console.error("❌ HTML Elements not found");
                return;
            }

            console.log("🔹 Starting Shaka Player Init...");
            isInitRef.current = true; // Lock it immediately

            try {
                // 1. Load Library
                const shaka = (await import('shaka-player/dist/shaka-player.ui')).default;
                shaka.polyfill.installAll(); // Fix browser support

                // 2. Destroy old player if exists (Safety Check)
                if (playerRef.current) {
                    await playerRef.current.destroy();
                }

                // 3. Create Player
                const player = new shaka.Player(videoRef.current);
                const ui = new shaka.ui.Overlay(player, containerRef.current, videoRef.current);
                playerRef.current = player; // Save reference

                // 4. Configure
                player.configure({
                    drm: { clearKeys: STREAMS.clearKeys }
                });

                // 5. Add Listeners
                player.addEventListener('error', (e: any) => {
                    console.error('❌ SHAKA ERROR:', e.detail);
                });

                // 6. LOAD THE VIDEO
                console.log("🔹 Sending Network Request for Manifest...");
                await player.load(STREAMS.manifestUri);
                console.log("✅ Video Playing!");

            } catch (error) {
                console.error("❌ CRASH DURING INIT:", error);
                isInitRef.current = false; // Unlock if it crashes
            }
        };

        initPlayer();

        // Cleanup when leaving page
        return () => {
            if (playerRef.current) {
                playerRef.current.destroy();
                playerRef.current = null;
                isInitRef.current = false;
            }
        };
    }, []);

    return (
        <div
            ref={containerRef}
            className="relative w-full max-w-[800px] aspect-video bg-black rounded-lg shadow-xl overflow-hidden mx-auto"
        >
            <video ref={videoRef} className="w-full h-full" autoPlay muted controls />
        </div>
    );
}