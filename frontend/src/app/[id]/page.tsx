"use client";

import { useParams } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { io, Socket } from "socket.io-client";

interface FileType {
  id: number;
  filename: string;
  path: string;
}

export default function FolderPage() {
  const params = useParams();
  const folderId = params.id as string;

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [files, setFiles] = useState<FileType[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const socketRef = useRef<Socket | null>(null);

  // Fetch files from API
  const fetchFiles = async () => {
    if (!folderId) return;

    setLoading(true);
    setErrorMsg(null);

    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/files/${folderId}`,

  {
    method: "GET", // optional for GET, but good practice
    headers: {
      "Content-Type": "application/json",
      "ngrok-skip-browser-warning": "true",
    },
  }
      );

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const data = await response.json();
      console.log(" this is the data ",data);
      setFiles(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("Fetch files failed:", err);
      setErrorMsg("Failed to load files");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!folderId) return;

    fetchFiles();

    // Socket connection
    socketRef.current = io(`${process.env.NEXT_PUBLIC_API_URL}`, {
         transports: ["websocket"],
      reconnection: true,
      reconnectionAttempts: 5,
      timeout: 10000,
    });

    const socket = socketRef.current;

    socket.on("connect", () => {
      socket.emit("joinFolder", folderId);
    });

    socket.on("fileAdded", (newFile: FileType) => {
      setFiles((prev) => {
        if (prev.some((f) => f.id === newFile.id)) return prev;
        return [newFile, ...prev];
      });
    });

    socket.on("fileDeleted", (deletedId: number) => {
      setFiles((prev) => prev.filter((f) => f.id !== deletedId));
    });

    socket.on("connect_error", (err) => {
      console.warn("Socket connection issue:", err.message);
    });

    return () => {
      socket.disconnect();
    };
  }, [folderId]);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !folderId) return;

    setUploading(true);
    setErrorMsg(null);

    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("folderId", folderId);

      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/files/upload`, {
        method: "POST",
        headers: {
      "Content-Type": "application/json",
      "ngrok-skip-browser-warning": "true",
    },

        body: formData,
      });

      if (!response.ok) {
        const text = await response.text();
        throw new Error(`Upload failed: ${response.status} – ${text}`);
      }

    
    } catch (err: any) {
      console.error("Upload error:", err);
      setErrorMsg(err.message || "Upload failed");
    } finally {
      setUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  const openFilePicker = () => {
    fileInputRef.current?.click();
  };

  
  return (
    <div className="min-h-screen bg-gray-50 px-6 py-8 md:px-8">
      <div className="mx-auto max-w-7xl">
        <div className="mb-8 flex items-center justify-between">
          <h1 className="text-3xl font-bold text-gray-800">
            Folder {folderId}
          </h1>

          <button
            type="button"
            onClick={openFilePicker}
            disabled={uploading || loading}
            className={`
              rounded-lg px-5 py-2.5 font-medium text-white shadow-sm transition-colors
              ${uploading || loading
                ? "cursor-not-allowed bg-gray-400"
                : "bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800"
              }
            `}
          >
            {uploading ? "Uploading..." : "Upload Image / Video"}
          </button>

          <input
            type="file"
            accept="image/*,video/*"
            ref={fileInputRef}
            onChange={handleFileSelect}
            className="hidden"
          />
        </div>

        {errorMsg && (
          <div className="mb-6 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-red-700">
            {errorMsg}
          </div>
        )}

        {loading ? (
          <div className="py-12 text-center text-gray-500">Loading files...</div>
        ) : files.length === 0 ? (
          <div className="py-16 text-center text-gray-500">
            <p className="text-lg">No media files found in this folder</p>
            <p className="mt-1">Upload images or videos using the button above</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
            {files.map((file) => (
              <div
                key={file.id}
                className="group relative aspect-square overflow-hidden rounded-xl bg-white shadow-sm"
              >
                {/\.(mp4|webm|ogg)$/i.test(file.filename) ? (
                  <video
                    src={`${process.env.NEXT_PUBLIC_API_URL}/uploads/${file.filename}`}
                    controls
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <img
                    src={`${process.env.NEXT_PUBLIC_API_URL}/uploads/${file.filename}`}
                    alt={file.filename}
                    className="h-full w-full object-cover transition-transform group-hover:scale-105"
                    loading="lazy"
                  />
                )}

                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 transition-opacity group-hover:opacity-100" />

                <p className="absolute bottom-0 left-0 right-0 truncate px-3 pb-2.5 pt-6 text-sm text-white opacity-0 transition-opacity group-hover:opacity-100">
                  {file.filename}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}