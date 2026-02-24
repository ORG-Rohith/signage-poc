"use client";

import React, { useEffect, useRef, useState } from "react";
import { useParams } from "next/navigation";
import { io, Socket } from "socket.io-client";

type Screen = {
  id: number;
  uniqueCode: string;
  fileId: number | null;
  filePath: string | null;
  fileStatus: string;
  folderId: number | null;
};

interface FileType {
  id: number;
  filename: string;
  path: string;
};

const Page = () => {
  const params = useParams();
  const id = params.id as string;

  const [screen, setScreen] = useState<Screen | null>(null);
  const [files, setFiles] = useState<FileType[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewState, setViewState] = useState<"code" | "image" | "busy">("code");

  const socketRef = useRef<Socket | null>(null);

  
  useEffect(() => {
    socketRef.current = io(`${process.env.NEXT_PUBLIC_API_URL}`,
      {
  transports: ["websocket"], // important for ngrok
      }
    );

    return () => {
      socketRef.current?.disconnect();
    };
  }, []);

  
  useEffect(() => {
    if (!id) return;

    const fetchScreen = async () => {
      try {
        setLoading(true);

        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/screen/${id}`,
          {
    method: "GET", // optional for GET, but good practice
    headers: {
      "Content-Type": "application/json",
      "ngrok-skip-browser-warning": "true",
    },
  }
        );
        const data: Screen = await res.json();

        setScreen(data);

        // Fetch files using folderId
        if (data.folderId) {
          const resFiles = await fetch(
            `${process.env.NEXT_PUBLIC_API_URL}/api/files/${data.folderId}`,
            {
    method: "GET", // optional for GET, but good practice
    headers: {
      "Content-Type": "application/json",
      "ngrok-skip-browser-warning": "true",
    },
  }
          );
          const fileData = await resFiles.json();
          setFiles(fileData);
        } else {
          setFiles([]);
        }

        // View logic
        if (data.fileStatus === "offline" && !data.filePath) {
          setViewState("code");
        } else if (data.fileStatus === "offline" && data.filePath) {
          setViewState("image");
          await updateStatus("online");
        } else if (data.fileStatus === "online" && data.filePath) {
          setViewState("busy");
        }
      } catch (err) {
        console.error("Error:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchScreen();
  }, [id]);

  
  useEffect(() => {
    if (!screen?.folderId || !socketRef.current) return;

    const socket = socketRef.current;

    console.log("Joining folder room:", screen.folderId);

    socket.emit("joinFolder", screen.folderId.toString());

    socket.on("fileAdded", (newFile: FileType) => {
      setFiles((prev) => [newFile, ...prev]);
    });

    socket.on("fileDeleted", (deletedFileId: number) => {
      setFiles((prev) =>
        prev.filter((file) => file.id !== deletedFileId)
      );
    });

    return () => {
      socket.off("fileAdded");
      socket.off("fileDeleted");
    };
  }, [screen?.folderId]);

  // ====================================
  // 4️⃣ Update screen status
  // ====================================
  const updateStatus = async (status: "online" | "offline") => {
    try {
      await fetch(`${process.env.NEXT_PUBLIC_API_URL}/screen/status/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" ,
                "ngrok-skip-browser-warning": "true"
        },
        body: JSON.stringify({ status }),
      });
    } catch (err) {
      console.error("Status update failed", err);
    }
  };

 
  useEffect(() => {
    const handleUnload = () => {
      navigator.sendBeacon(
        `${process.env.NEXT_PUBLIC_API_URL}/screen/status/${id}`,
        
        new Blob([JSON.stringify({ status: "offline" })], {
          type: "application/json",
        })
      );
    };

    window.addEventListener("beforeunload", handleUnload);

    return () => {
      window.removeEventListener("beforeunload", handleUnload);
    };
  }, [id]);

  
  if (loading) return <p>Loading...</p>;
  if (!screen) return <p>Screen not found</p>;

  return (
    <div className="flex items-center justify-center min-h-screen bg-black text-white">

      {viewState === "code" && (
        <div className="text-center">
          <h1 className="text-5xl font-bold">{screen.uniqueCode}</h1>
          <p className="mt-3">Enter this code to verify</p>
        </div>
      )}

      {viewState === "image" && (
        files.length === 0 ? (
          <div className="text-center">
            <p className="mb-4 text-gray-500">
              No images or videos found
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-3 gap-4">
            {files.map((file) => (
              <div key={file.id} className="bg-white p-2 rounded shadow">
                {file.filename.match(/\.(mp4|webm|ogg)$/i) ? (
                  <video
                    src={`${process.env.NEXT_PUBLIC_API_URL}/uploads/${file.filename}`}
                    controls
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <img
                    src={`${process.env.NEXT_PUBLIC_API_URL}/uploads/${file.filename}`}
                    alt={file.filename}
                    className="w-full h-full object-cover"
                  />
                )}
              </div>
            ))}
          </div>
        )
      )}

      {viewState === "busy" && (
        <div className="text-center">
          <h1 className="text-2xl font-bold text-red-500">
            This screen is used in another device
          </h1>
        </div>
      )}
    </div>
  );
};

export default Page;


