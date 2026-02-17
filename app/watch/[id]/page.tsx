import pool from '@/lib/db';
import Link from 'next/link';
import DynamicPlayer from '@/components/ShakaPlayer'; // Import the Middleman

// Helper to fetch video from DB
async function getVideo(id: string) {
    const query = 'SELECT * FROM videos WHERE id = $1';
    const result = await pool.query(query, [id]);
    console.log(result.rows[0])
    return result.rows[0];
}

interface PageProps {
    params: Promise<{ id: string }>;
}

export default async function WatchPage({ params }: PageProps) {
    const { id } = await params;
    const video = await getVideo(id);

    if (!video) {
        return <div className="text-center mt-20 text-red-500">Video not found!</div>;
    }

    return (
        <div className="min-h-screen bg-gray-900 text-white p-8">
            <div className="max-w-4xl mx-auto">
                <Link href="/upload" className="text-blue-400 hover:underline mb-4 block">
                    &larr; Back to Upload
                </Link>

                <h1 className="text-3xl font-bold mb-6">{video.title || "Untitled Video"}</h1>

                {/* Use the Middleman Component */}
                <DynamicPlayer manifestUrl={video.manifest_url} />

                <div className="mt-6 p-4 bg-gray-800 rounded">
                    <h2 className="text-xl font-semibold mb-2">Debug Info</h2>
                    <p className="text-gray-400 text-sm">Video ID: {video.id}</p>
                </div>
            </div>
        </div>
    );
}