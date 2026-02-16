"use client";
import { useState } from 'react';

export default function UploadPage() {
  const [uploading, setUploading] = useState(false);
  const [status, setStatus] = useState("");
  const [videoData, setVideoData] = useState<{ manifestUrl: string, keyId: string, key: string } | null>(null);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files?.[0]) return;

    setUploading(true);
    setStatus("Uploading & Encrypting... (This may take a minute)");

    const formData = new FormData();
    formData.append("video", e.target.files[0]);

    try {
      const res = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });

      const data = await res.json();

      if (res.ok) {
        setStatus("✅ Success! Video Encrypted.");
        setVideoData(data);
        console.log("SAVE THESE KEYS:", data); // Check your browser console!
      } else {
        setStatus("❌ Error: " + data.error);
      }
    } catch (err) {
      setStatus("❌ Upload failed");
      console.error(err);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="p-10 max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Upload & Encrypt Video</h1>

      <input
        type="file"
        accept="video/*"
        onChange={handleUpload}
        disabled={uploading}
        className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
      />

      {uploading && <p className="mt-4 text-blue-600 animate-pulse">{status}</p>}

      {videoData && (
        <div className="mt-8 p-4 bg-gray-100 rounded border border-gray-300 overflow-hidden break-all">
          <h3 className="font-bold text-green-600 mb-2">🎉 Encryption Complete!</h3>
          <p><strong>Manifest URL:</strong> <br />{videoData.manifestUrl}</p>
          <p className="mt-2"><strong>Key ID:</strong> <br />{videoData.keyId}</p>
          <p className="mt-2"><strong>Secret Key:</strong> <br />{videoData.key}</p>

          <div className="mt-4 p-2 bg-yellow-100 text-yellow-800 text-sm rounded">
            ⚠️ <strong>Action Required:</strong> Copy the Key ID and Secret Key above. You need to paste them into your License API to play this video.
          </div>
        </div>
      )}
    </div>
  );
}