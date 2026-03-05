
"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

type Screen = {
  id: number;
  uniqueCode: string;
  fileId: number | null;
  filePath: string | null;
  fileStatus: string;
};

const Page = () => {
  const [screens, setScreens] = useState<Screen[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  const handleStatusChange = async (screenId: number) => {
  try {
    const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/screen/statusupdate`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
              "ngrok-skip-browser-warning": "true",
      },
      body: JSON.stringify({
        id: screenId,
        fileStatus: "offline",
      }),
    });

    if (!res.ok) {
      throw new Error("Failed to update status");
    }

    const data = await res.json();
    console.log("Status updated:", data);

    
  } catch (error) {
    console.error("Error updating status:", error);
  }
};

  useEffect(() => {
    fetchScreens();
  }, []);

  const fetchScreens = async () => {
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/screen/getall`,
          {
    method: "GET", 
    headers: {
      "Content-Type": "application/json",
      "ngrok-skip-browser-warning": "true",
    },
  }
      );
      const data = await res.json();

      if (Array.isArray(data)) {
        setScreens(data);
      } else if (data.data) {
        setScreens(data.data);
      } else {
        setScreens([]);
      }
    } catch (error) {
      console.error(error);
      setScreens([]);
    } finally {
      setLoading(false);
    }
  };

  const getImageName = (path: string | null) => {
    if (!path) return "-";
    return path.split("/").pop();
  };

  return (
    <div className="p-6 bg-white min-h-screen">
      <h2 className="text-2xl font-bold mb-4 text-black">Screen List</h2>

      {loading ? (
        <p>Loading...</p>
      ) : screens.length === 0 ? (
        <p className="text-red-500">Screen not found</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full border border-gray-300 text-center text-black">
            <thead className="bg-gray-200">
              <tr>
                <th className="border p-2">Screen ID</th>
                <th className="border p-2">Unique Code</th>
                <th className="border p-2">File ID</th>
                <th className="border p-2">Image Name</th>
                <th className="border p-2">Status</th>
                <th className="border p-2">Action</th>
                <th className="border p-2">Change Status</th>

              </tr>
            </thead>

            <tbody>
              {screens.map((screen) => (
                <tr key={screen.id}>
                  <td className="border p-2">{screen.id}</td>
                  <td className="border p-2">{screen.uniqueCode}</td>
                  <td className="border p-2">{screen.fileId ?? "-"}</td>
                  <td className="border p-2">
                    {getImageName(screen.filePath)}
                  </td>
                  <td className="border p-2">
                    {screen.fileStatus}
                  </td>
                  <td className="border p-2">
                    <button
                      onClick={() => router.push(`/screen/${screen.id}`)}
                      className="bg-blue-500 text-white px-3 py-1 rounded"
                    >
                      View
                    </button>
                  </td>
                    <td className="border p-2">
                    <button
                      onClick={() => handleStatusChange(screen.id)}
                      className="bg-blue-500 text-white px-3 py-1 rounded"
                    >
                      Change
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default Page;