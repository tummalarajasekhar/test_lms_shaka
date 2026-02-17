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

  // Keep a reference to the active player so we can destroy it properly
  const playerRef = useRef<any>(null);
  const uiRef = useRef<any>(null);

  useEffect(() => {
    let mounted = true; // Flag to prevent running if component unmounted

    const initPlayer = async () => {
      // 1. Wait for browser environment
      if (typeof window === 'undefined' || !videoRef.current || !containerRef.current) return;

      // 2. Load Shaka Library dynamically
      const shaka = (await import('shaka-player/dist/shaka-player.ui')).default;

      // 3. Check if browser is supported
      if (!shaka.Player.isBrowserSupported()) {
        console.error('Browser not supported!');
        return;
      }

      // 4. CLEANUP: Destroy any existing player before creating a new one
      // (This fixes the Next.js Strict Mode "Double Load" crash)
      if (playerRef.current) {
        await playerRef.current.destroy();
        playerRef.current = null;
      }

      // 5. Initialize
      const player = new shaka.Player(videoRef.current);
      const ui = new shaka.ui.Overlay(player, containerRef.current, videoRef.current);

      // Save to refs so we can clean them up later
      playerRef.current = player;
      uiRef.current = ui;

      // 6. Configure Keys
      player.configure({
        drm: {
          clearKeys: STREAMS.clearKeys
        }
      });

      // 7. Error Listener (Logs specific error codes)
      player.addEventListener('error', (event: any) => {
        console.error('❌ Shaka Player Error:', event.detail.code, event.detail);
      });

      // 8. Load Video
      try {
        if (mounted) {
          await player.load(STREAMS.manifestUri);
          console.log('✅ Video loaded successfully!');
        }
      } catch (e: any) {
        console.error('❌ Load failed. Error Code:', e.code, 'Details:', e);
      }
    };

    initPlayer();

    // CLEANUP FUNCTION (Runs when you leave the page or during Strict Mode re-render)
    return () => {
      mounted = false;
      if (uiRef.current) {
        uiRef.current.destroy();
        uiRef.current = null;
      }
      if (playerRef.current) {
        playerRef.current.destroy();
        playerRef.current = null;
      }
    };
  }, []);

  return (
    <div
      ref={containerRef}
      className="relative w-full max-w-[800px] aspect-video bg-black rounded-lg shadow-xl overflow-hidden mx-auto"
    >
      <video
        ref={videoRef}
        className="w-full h-full"
        autoPlay
        muted
        controls
      />
    </div>
  );
}