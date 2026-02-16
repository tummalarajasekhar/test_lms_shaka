"use client";
import { useEffect, useRef } from 'react';
import 'shaka-player/dist/controls.css'; // Import the CSS styles
const shaka = require('shaka-player/dist/shaka-player.ui'); // Import the UI library

export default function ShakaPlayer() {
    const videoRef = useRef<HTMLVideoElement>(null);
    const containerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        let player: any;
        let ui: any;

        const initPlayer = async () => {
            // 1. Wait for refs to be ready
            if (!videoRef.current || !containerRef.current) return;

            // 2. Initialize the Player and UI Overlay
            // (This replaces the 'data-shaka-player-container' auto-setup)
            player = new shaka.Player(videoRef.current);
            ui = new shaka.ui.Overlay(player, containerRef.current, videoRef.current);

            // 3. Configure the Player (Exact same keys from your HTML)
            player.configure({
                drm: {
                    clearKeys: {
                        'a7a1ba9a35134b18b38c350db6bf58b6': '200baf2fafa84eb3b74ff7482214dc63'
                    }
                },
                preferredKeySystems: ['org.w3.clearkey']
            });

            // 4. Error Listener
            player.addEventListener('error', (event: any) => {
                console.error('Shaka Error Code:', event.detail.code, 'Details:', event.detail);
            });

            // 5. Load the Video
            try {
                await player.load('https://pub-f3f7b48ee2de4185b812cace3391b2a4.r2.dev/f7a469de-555e-481a-b637-ea13994d2ad4/manifest.mpd');
                console.log('✅ Video loaded successfully in Next.js!');
            } catch (e: any) {
                console.error('❌ Error loading video:', e);
            }
        };

        initPlayer();

        // Cleanup when leaving the page
        return () => {
            if (ui) ui.destroy();
            if (player) player.destroy();
        };
    }, []);

    return (
        // The Container (Replacing the div with data-shaka-player-container)
        <div
            ref={containerRef}
            className="relative w-full max-w-[800px] aspect-video bg-black rounded shadow-lg overflow-hidden mx-auto"
        >
            {/* The Video (Replacing the video tag) */}
            <video
                ref={videoRef}
                className="w-full h-full"
                autoPlay
                muted
                controls // Keep native controls enabled as a fallback
            />
        </div>
    );
}