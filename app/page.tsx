"use client";
import dynamic from 'next/dynamic';

// 1. Dynamic Import: Forces the component to load ONLY in the browser
const Player = dynamic(() => import('@/components/Player'), {
  ssr: false, // Disables Server-Side Rendering for this component
  loading: () => (
    // 2. Loading State: What the user sees while Shaka loads
    <div className="w-full max-w-[800px] aspect-video bg-gray-900 mx-auto flex items-center justify-center text-gray-500 rounded-lg animate-pulse">
      <span className="text-xl font-mono">Loading Player...</span>
    </div>
  )
});

export default function Home() {
  return (
    <main className="min-h-screen bg-black flex flex-col items-center justify-center p-8">

      <div className="w-full max-w-4xl space-y-6">
        <h1 className="text-3xl font-bold text-white text-center tracking-tight">
          Next.js DRM Player
        </h1>

        {/* The Player Component */}
        <div className="border border-gray-800 rounded-xl p-1 bg-gray-900 shadow-2xl">
          <Player />
        </div>

        <p className="text-center text-gray-500 text-sm font-mono">
          Powered by Shaka Player & Cloudflare R2
        </p>
      </div>

    </main>
  );
}