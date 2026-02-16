"use client";
import { useEffect, useRef } from 'react';
import shaka from 'shaka-player/dist/shaka-player.ui';
import 'shaka-player/dist/controls.css'; // Important for Play/Pause buttons

interface VideoPlayerProps {
    manifestUrl: string;
}

export default function VideoPlayer({ manifestUrl }: VideoPlayerProps) {
    const videoRef = useRef<HTMLVideoElement>(null);
    const containerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        let player: any;
        let ui: any;

        const initPlayer = async () => {
            if (!videoRef.current || !containerRef.current) return;

            // 1. Create Player Instance
            player = new shaka.Player(videoRef.current);

            // 2. Attach UI (Play buttons, volume, etc)
            ui = new shaka.ui.Overlay(player, containerRef.current, videoRef.current);

            // 3. LISTEN FOR ERRORS (This will help you debug!)
            player.addEventListener('error', (event: any) => {
                console.error('❌ SHAKA PLAYER ERROR:', event.detail);
            });

            // 4. Configure DRM (License Server)
            player.configure({
                drm: {
                    servers: {
                        'org.w3.clearkey': '/api/license' // Points to your Next.js Route
                    }
                }
            });

            // 5. Load the Video
            try {
                console.log("Loading manifest:", manifestUrl);
                await player.load(manifestUrl);
                console.log("✅ Video loaded successfully!");
            } catch (error: any) {
                console.error("❌ Error loading video:", error);
            }
        };

        initPlayer();

        // Cleanup when component unmounts
        return () => {
            if (ui) ui.destroy();
            if (player) player.destroy();
        };
    }, [manifestUrl]);

    return (
        // "relative" is needed for the UI overlay to position itself correctly
        <div ref={containerRef} className="relative w-full aspect-video bg-black rounded-lg overflow-hidden shadow-2xl">
            <video
                ref={videoRef}
                className="w-full h-full"
                poster="https://shaka-player-demo.appspot.com/assets/poster.jpg"
                autoPlay
                muted // Muted needed for autoplay in some browsers
            />
        </div>
    );
}