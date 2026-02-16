"use client";
import { useEffect, useRef, useState } from 'react';
import shaka from 'shaka-player/dist/shaka-player.ui';
import 'shaka-player/dist/controls.css';

interface ManualPlayerProps {
    manifestUrl: string;
    keyId: string;
    keySecret: string;
}

export default function ManualPlayer({ manifestUrl, keyId, keySecret }: ManualPlayerProps) {
    const videoRef = useRef<HTMLVideoElement>(null);
    const containerRef = useRef<HTMLDivElement>(null);
    const [errorMsg, setErrorMsg] = useState<string>("");

    useEffect(() => {
        let player: any;
        let ui: any;

        const initPlayer = async () => {
            if (!videoRef.current || !containerRef.current) return;

            // FIX 1: Check if polyfill exists before calling
            if (shaka.polyfill) {
                shaka.polyfill.installAll();
            }

            // FIX 2: REMOVE shaka.log.setLevel (It causes the crash)
            // We will rely on standard console.log instead.

            if (shaka.Player.isBrowserSupported()) {
                player = new shaka.Player(videoRef.current);
                ui = new shaka.ui.Overlay(player, containerRef.current, videoRef.current);

                // Listen for Errors
                player.addEventListener('error', (event: any) => {
                    const { code, data } = event.detail;
                    console.error('❌ SHAKA FAILURE:', event.detail);

                    if (code === 7002) {
                        const originalUrl = data[0];
                        const status = data[1];
                        setErrorMsg(`Network Error ${status} on URL: ${originalUrl}`);
                    } else if (code === 6002) {
                        setErrorMsg(`DRM Error: Key ID not found in the video manifest.`);
                    } else {
                        setErrorMsg(`Shaka Error ${code}: Check Console`);
                    }
                });

                // Configure Keys
                player.configure({
                    drm: {
                        clearKeys: {
                            [keyId.toLowerCase()]: keySecret.toLowerCase()
                        }
                    },
                    streaming: {
                        retryParameters: {
                            maxAttempts: 2,
                            baseDelay: 1000,
                            backoffFactor: 2,
                            fuzzFactor: 0.5,
                        }
                    }
                });

                try {
                    console.log("Attempting to load:", manifestUrl);
                    await player.load(manifestUrl);
                    console.log("✅ Video loaded successfully!");
                    setErrorMsg(""); // Clear errors if successful
                } catch (e: any) {
                    console.error("Load failed", e);
                }
            } else {
                setErrorMsg("Browser not supported!");
            }
        };

        initPlayer();

        return () => {
            if (ui) ui.destroy();
            if (player) player.destroy();
        };
    }, [manifestUrl, keyId, keySecret]);

    return (
        <div className="w-full">
            {errorMsg && (
                <div className="bg-red-600 text-white p-3 mb-4 rounded font-mono text-sm break-all shadow-md">
                    ⚠️ {errorMsg}
                </div>
            )}
            <div ref={containerRef} className="relative w-full aspect-video bg-black rounded shadow-lg overflow-hidden border border-gray-800">
                <video
                    ref={videoRef}
                    className="w-full h-full"
                    poster="https://shaka-player-demo.appspot.com/assets/poster.jpg"
                    autoPlay
                    controls // Keep native controls enabled as fallback
                />
            </div>
        </div>
    );
}