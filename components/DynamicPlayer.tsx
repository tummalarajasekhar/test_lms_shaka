"use client"; // This must be a Client Component

import dynamic from 'next/dynamic';

// Import the actual Player component with SSR disabled
const VideoPlayer = dynamic(() => import('./Player'), {
    ssr: false,
    loading: () => <div className="w-full aspect-video bg-gray-800 animate-pulse rounded-lg flex items-center justify-center text-gray-500">Loading Player...</div>
});

export default function DynamicPlayer({ manifestUrl }: { manifestUrl: string }) {
    return <VideoPlayer manifestUrl={manifestUrl} />;
}