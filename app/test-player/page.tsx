"use client";
import { useState } from 'react';
import dynamic from 'next/dynamic';

// Dynamic import to avoid SSR errors
const ManualPlayer = dynamic(() => import('@/components/ManualPlayer'), {
    ssr: false,
    loading: () => <div className="text-white">Loading Player Module...</div>
});

export default function TestPlayerPage() {
    const [manifest, setManifest] = useState('');
    const [kid, setKid] = useState('');
    const [key, setKey] = useState('');
    const [showPlayer, setShowPlayer] = useState(false);

    const handlePlay = (e: React.FormEvent) => {
        e.preventDefault();
        if (manifest && kid && key) {
            setShowPlayer(false);
            setTimeout(() => setShowPlayer(true), 50);
        }
    };

    return (
        <div className="min-h-screen bg-gray-900 text-white p-8 font-sans">
            <div className="max-w-5xl mx-auto">
                <h1 className="text-3xl font-bold mb-8 border-b border-gray-700 pb-4">🛠️ Manual DRM Tester</h1>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

                    {/* Input Section */}
                    <div className="bg-gray-800 p-6 rounded-lg h-fit">
                        <form onSubmit={handlePlay} className="space-y-4">
                            <div>
                                <label className="block text-xs font-bold text-gray-400 mb-1">MANIFEST URL (Cloudflare)</label>
                                <input
                                    type="text"
                                    className="w-full p-2 bg-gray-700 border border-gray-600 rounded text-sm text-white focus:outline-none focus:border-blue-500"
                                    placeholder="https://..."
                                    value={manifest}
                                    onChange={(e) => setManifest(e.target.value.trim())}
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-gray-400 mb-1">KEY ID (Hex)</label>
                                <input
                                    type="text"
                                    className="w-full p-2 bg-gray-700 border border-gray-600 rounded text-sm text-white font-mono focus:outline-none focus:border-blue-500"
                                    placeholder="e.g. 3510926b..."
                                    value={kid}
                                    onChange={(e) => setKid(e.target.value.trim())}
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-gray-400 mb-1">SECRET KEY (Hex)</label>
                                <input
                                    type="text"
                                    className="w-full p-2 bg-gray-700 border border-gray-600 rounded text-sm text-white font-mono focus:outline-none focus:border-blue-500"
                                    placeholder="e.g. 6fc303bb..."
                                    value={key}
                                    onChange={(e) => setKey(e.target.value.trim())}
                                />
                            </div>

                            <button type="submit" className="w-full bg-blue-600 hover:bg-blue-500 text-white py-3 rounded font-bold transition-colors">
                                ▶ Load Player
                            </button>
                        </form>
                    </div>

                    {/* Player Section */}
                    <div className="lg:col-span-2">
                        {showPlayer ? (
                            <ManualPlayer manifestUrl={manifest} keyId={kid} keySecret={key} />
                        ) : (
                            <div className="w-full aspect-video bg-black rounded-lg border-2 border-dashed border-gray-700 flex items-center justify-center text-gray-500">
                                Enter details and click Load to test
                            </div>
                        )}

                        <div className="mt-4 text-xs text-gray-500">
                            <p><strong>Note:</strong> If this fails with 7002, check the Red Box above for the specific URL that failed.</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}