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
  const [viewState, setViewState] = useState<"code" | "image" | "busy">("code");
  const [currentIndex, setCurrentIndex] = useState(0);

  const [connectionStatus, setConnectionStatus] = useState<
    "connected" | "reconnecting" | "disconnected"
  >("disconnected");

  const [isOnline, setIsOnline] = useState(true);

  const socketRef = useRef<Socket | null>(null);

  /* ------------------------------------------------ */
  /* INTERNET STATUS DETECTION */
  /* ------------------------------------------------ */

  useEffect(() => {
    const updateStatus = () => {
      console.log("Internet:", navigator.onLine);
      setIsOnline(navigator.onLine);
    };

    updateStatus();

    window.addEventListener("online", updateStatus);
    window.addEventListener("offline", updateStatus);

    const interval = setInterval(() => {
      setIsOnline(navigator.onLine);
    }, 3000);

    return () => {
      window.removeEventListener("online", updateStatus);
      window.removeEventListener("offline", updateStatus);
      clearInterval(interval);
    };
  }, []);

  /* ------------------------------------------------ */
  /* SERVICE WORKER */
  /* ------------------------------------------------ */

  useEffect(() => {
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker
        .register("/sw.js")
        .then(() => console.log("Service Worker registered"))
        .catch((err) => console.log("SW failed", err));
    }
  }, []);

  /* ------------------------------------------------ */
  /* SOCKET CONNECTION */
  /* ------------------------------------------------ */

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

  /* ------------------------------------------------ */
  /* FETCH SCREEN + FILES */
  /* ------------------------------------------------ */

  useEffect(() => {
    if (!id) return;

    const fetchScreen = async () => {
      try {
        setLoading(true);

        const res = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/api/screen/${id}`,
        );

        const data: Screen = await res.json();
        setScreen(data);

        if (data.folderId) {
          const resFiles = await fetch(
            `${process.env.NEXT_PUBLIC_API_URL}/api/files/${data.folderId}`,
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
        console.log("Offline mode: using cached data");
      } finally {
        setLoading(false);
      }
    };

    fetchScreen();
  }, [id]);

  /* ------------------------------------------------ */
  /* PRELOAD MEDIA FOR CACHE */
  /* ------------------------------------------------ */

  useEffect(() => {
    if (!files.length) return;

    files.forEach((file) => {
      const url = `${process.env.NEXT_PUBLIC_API_URL}/uploads/${file.filename}`;

      fetch(url, { cache: "reload" })
        .then(() => console.log("Cached:", url))
        .catch(() => console.log("Offline, using cache"));
    });
  }, [files]);

  /* ------------------------------------------------ */
  /* SOCKET ROOM EVENTS */
  /* ------------------------------------------------ */

  useEffect(() => {
    if (!screen?.folderId || !socketRef.current) return;

    const socket = socketRef.current;

    socket.emit("joinFolder", screen.folderId.toString());

    socket.on("fileAdded", (newFile: FileType) => {
      setFiles((prev) => [newFile, ...prev]);
    });

    socket.on("fileDeleted", (deletedFileId: number) => {
      setFiles((prev) => prev.filter((file) => file.id !== deletedFileId));
    });

    return () => {
      socket.off("fileAdded");
      socket.off("fileDeleted");
    };
  }, [screen?.folderId]);

  /* ------------------------------------------------ */
  /* SLIDESHOW */
  /* ------------------------------------------------ */

  useEffect(() => {
    if (files.length === 0 || viewState !== "image") return;

    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev === files.length - 1 ? 0 : prev + 1));
    }, 5000);

    return () => clearInterval(interval);
  }, [files, viewState]);

  /* ------------------------------------------------ */
  /* UPDATE SCREEN STATUS */
  /* ------------------------------------------------ */

  const updateStatus = async (status: "online" | "offline") => {
    try {
      await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/screen/status/${id}`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ status }),
        },
      );
    } catch {
      console.log("Offline - status not updated");
    }
  };

  /* ------------------------------------------------ */
  /* SET OFFLINE WHEN TAB CLOSES */
  /* ------------------------------------------------ */

  useEffect(() => {
    const handleUnload = () => {
      navigator.sendBeacon(
        `${process.env.NEXT_PUBLIC_API_URL}/api/screen/status/${id}`,
        new Blob([JSON.stringify({ status: "offline" })], {
          type: "application/json",
        }),
      );
    };

    window.addEventListener("beforeunload", handleUnload);

    return () => {
      window.removeEventListener("beforeunload", handleUnload);
    };
  }, [id]);

  if (loading) return <p>Loading...</p>;
  if (!screen) return <p>Screen not found</p>;

  const file = files[currentIndex];
  const isVideo = file && /\.(mp4|webm|ogg)$/i.test(file.filename);

  return (
    <div className="relative flex items-center justify-center min-h-screen bg-black text-white">
      {/* INTERNET STATUS */}
      {!isOnline && (
        <div className="absolute top-4 left-4 bg-red-600 px-3 py-1 rounded">
          Offline Mode
        </div>
      )}

      {/* SOCKET STATUS */}
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
        <span className="text-sm">{connectionStatus}</span>
      </div>

      {/* CODE VIEW */}
      {viewState === "code" && (
        <div className="text-center">
          <h1 className="text-5xl font-bold">{screen.uniqueCode}</h1>
          <p className="mt-3">Enter this code to verify</p>
        </div>
      )}

      {/* IMAGE / VIDEO VIEW */}
      {viewState === "image" &&
        (files.length === 0 ? (
          <p className="text-gray-500">No media found</p>
        ) : isVideo ? (
          <video
            key={file.id}
            src={`${process.env.NEXT_PUBLIC_API_URL}/uploads/${file.filename}`}
            autoPlay
            muted
            playsInline
            className="max-w-full max-h-screen object-contain"
            onEnded={() =>
              setCurrentIndex((prev) =>
                prev === files.length - 1 ? 0 : prev + 1,
              )
            }
          />
        ) : (
          <img
            key={file.id}
            src={`${process.env.NEXT_PUBLIC_API_URL}/uploads/${file.filename}`}
            alt={file.filename}
            className="max-w-full max-h-screen object-contain"
          />
        ))}

      {/* BUSY VIEW */}
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
