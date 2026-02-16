"use client";
import dynamic from 'next/dynamic';

// Import the player with SSR disabled
const ShakaPlayer = dynamic(() => import('@/components/ShakaPlayer'), {
    ssr: false,
    loading: () => <div className="text-white text-center mt-10">Loading Player...</div>
});

export default function TestPage() {
    return (
        <div className="min-h-screen bg-gray-900 flex flex-col items-center justify-center p-4">
            <h1 className="text-2xl font-bold text-white mb-6">Next.js Shaka Player</h1>
            <ShakaPlayer />
        </div>
    );
}