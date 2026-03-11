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
}

const Page = () => {
  const params = useParams();
  const id = params.id as string;

  const [screen, setScreen] = useState<Screen | null>(null);
  const [files, setFiles] = useState<FileType[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewState, setViewState] =
    useState<"code" | "image" | "busy">("code");
  const [currentIndex, setCurrentIndex] = useState(0);

  // 🔥 NEW: connection state
  const [connectionStatus, setConnectionStatus] = useState<
    "connected" | "reconnecting" | "disconnected"
  >("disconnected");

  const socketRef = useRef<Socket | null>(null);

  useEffect(() => {
  if (!files.length) return;

  files.forEach((file) => {
    const url = `${process.env.NEXT_PUBLIC_API_URL}/uploads/${file.filename}`;
    fetch(url);
  });
}, [files]);

  // Service Worker
  useEffect(() => {
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker
        .register("/sw.js")
        .then(() => console.log("Service Worker registered"))
        .catch((err) => console.log("SW failed", err));
    }
  }, []);

  // 🔥 SOCKET WITH CONNECTION STATUS
  useEffect(() => {
    const socket = io(`${process.env.NEXT_PUBLIC_API_URL}`, {
      transports: ["websocket"],
      reconnection: true,
    });

    socketRef.current = socket;

    socket.on("connect", () => {
      console.log("Socket connected");
      setConnectionStatus("connected");
    });

    socket.on("disconnect", () => {
      console.log("Socket disconnected");
      setConnectionStatus("disconnected");
    });

    socket.on("reconnect_attempt", () => {
      console.log("Reconnecting...");
      setConnectionStatus("reconnecting");
    });

    socket.on("reconnect", () => {
      console.log("Reconnected");
      setConnectionStatus("connected");
    });

    return () => {
      socket.disconnect();
    };
  }, []);

  // Fetch screen + files
  useEffect(() => {
    if (!id) return;

    const fetchScreen = async () => {
      try {
        setLoading(true);

        const res = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/api/screen/${id}`,
          {
            headers: {
              "Content-Type": "application/json",
              "ngrok-skip-browser-warning": "true",
            },
          }
        );

        const data: Screen = await res.json();
        setScreen(data);

        if (data.folderId) {
          const resFiles = await fetch(
            `${process.env.NEXT_PUBLIC_API_URL}/api/files/${data.folderId}`,
            {
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

  // Join folder room
  useEffect(() => {
    if (!screen?.folderId || !socketRef.current) return;

    const socket = socketRef.current;

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

  useEffect(() => {
    if (files.length === 0) {
      setCurrentIndex(0);
      return;
    }

    if (currentIndex >= files.length) {
      setCurrentIndex(0);
    }
  }, [files]);

  useEffect(() => {
    if (files.length === 0 || viewState !== "image") return;

    const interval = setInterval(() => {
      setCurrentIndex((prev) =>
        prev === files.length - 1 ? 0 : prev + 1
      );
    }, 2000);

    return () => clearInterval(interval);
  }, [files, viewState]);

  const updateStatus = async (status: "online" | "offline") => {
    try {
      await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/screen/status/${id}`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            "ngrok-skip-browser-warning": "true",
          },
          body: JSON.stringify({ status }),
        }
      );
    } catch (err) {
      console.error("Status update failed", err);
    }
  };

  // Set offline on close
  useEffect(() => {
    const handleUnload = () => {
      navigator.sendBeacon(
        `${process.env.NEXT_PUBLIC_API_URL}/api/screen/status/${id}`,
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
    <div className="relative flex items-center justify-center min-h-screen bg-black text-white">

      {/* 🔥 CONNECTION INDICATOR */}
      <div className="absolute top-4 right-4 flex items-center gap-2">
        <div
          className={`w-4 h-4 rounded-full animate-pulse ${
            connectionStatus === "connected"
              ? "bg-green-500"
              : connectionStatus === "reconnecting"
              ? "bg-yellow-400"
              : "bg-red-500"
          }`}
        />
        <span className="text-sm">
          {connectionStatus === "connected"
            ? "Connected"
            : connectionStatus === "reconnecting"
            ? "Reconnecting..."
            : "Disconnected"}
        </span>
      </div>

      {viewState === "code" && (
        <div className="text-center">
          <h1 className="text-5xl font-bold">
            {screen.uniqueCode}
          </h1>
          <p className="mt-3">Enter this code to verify</p>
        </div>
      )}

      {viewState === "image" && (
        files.length === 0 ? (
          <p className="text-gray-500">
            No images or videos found
          </p>
        ) : (
          (() => {
            const file = files[currentIndex];
            if (!file) return null;

            const isVideo = /\.(mp4|webm|ogg)$/i.test(
              file.filename
            );

            return isVideo ? (
              <video
                key={file.id}
                src={`${process.env.NEXT_PUBLIC_API_URL}/uploads/${file.filename}`}
                autoPlay
                muted
                loop
                playsInline
                preload="auto"
                className="max-w-full max-h-screen object-contain"
              />
            ) : (
              <img
                key={file.id}
                src={`${process.env.NEXT_PUBLIC_API_URL}/uploads/${file.filename}`}
                alt={file.filename}
                className="max-w-full max-h-screen object-contain"
              />
            );
          })()
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
