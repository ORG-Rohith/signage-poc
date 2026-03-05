"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

interface Folder {
  id: number;
  name: string;
}

export default function Dashboard() {
  const [folders, setFolders] = useState<Folder[]>([]);
  const [folderName, setFolderName] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [verifyInputs, setVerifyInputs] = useState<{ [key: number]: string }>({});
const [verifiedRows, setVerifiedRows] = useState<{ [key: number]: boolean }>({});
  const router = useRouter();


const handleInputChange = (folderId: number, value: string) => {
  setVerifyInputs((prev) => ({
    ...prev,
    [folderId]: value,
  }));
};

// const handleVerify = async (folderId: number) => {
//   const code = verifyInputs[folderId];
//   if (!code) return;

//   try {
//     const res = await fetch("http://localhost:3001/screen/verify", {
//       method: "POST",
//       headers: {
//         "Content-Type": "application/json",
//       },
//       body: JSON.stringify({ code }),
//     });

//     const data = await res.json();

//     if (data.verified) {
//       setVerifiedRows((prev) => ({
//         ...prev,
//         [folderId]: true,
//       }));
//     } else {
//       alert("Invalid code");
//     }
//   } catch (error) {
//     console.error(error);
//   }
// };

const handleVerify = async (folderId: number) => {
  const code = verifyInputs[folderId];

  if (!code) return;

  try {
    const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/screen/verify`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      "ngrok-skip-browser-warning": "true",

      },
      body: JSON.stringify({
        code,
        folderId,
      }),
    });

    const data = await res.json();
    

    if (data.verified) {
      setVerifiedRows((prev) => ({
        ...prev,
        [folderId]: true,
      }));
    } else {
      alert(data.message || "Invalid code");
    }
  } catch (error) {
    console.error(error);
  }
};

  const handleAddScreen = async (e: React.MouseEvent<HTMLAnchorElement>) => {
    e.preventDefault(); 

    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/screen`, {
        method: "POST",
        headers: {
      "Content-Type": "application/json",
      "ngrok-skip-browser-warning": "true",
    },
      });

      const data = await res.json();
      console.log("Screen created:", data);
      alert(`Screen created. Code: ${data.uniqueCode}`);
    } catch (error) {
      console.error(error);
      alert("Failed to create screen");
    }
  };

  const fetchFolders = async () => {
    try {
      setLoading(true);
    //   const res = await fetch(`https://instructively-liturgistic-madie.ngrok-free.dev/api/folders`);
    const res = await fetch(
  `${process.env.NEXT_PUBLIC_API_URL}/api/folders`,
  {
    method: "GET", 
    headers: {
      "Content-Type": "application/json",
      "ngrok-skip-browser-warning": "true",
    },
  }
);

      if (!res.ok) {
        throw new Error("Failed to fetch folders");
      }

      const data = await res.json();
      setFolders(data);
    } catch (err) {
      setError("Unable to load folders");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFolders();
  }, []);

  const createFolder = async () => {
    if (!folderName.trim()) return;

    await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/folders`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
         "ngrok-skip-browser-warning": "true",
      },
      body: JSON.stringify({ name: folderName }),
    });

    setFolderName("");
    fetchFolders();
  };

  return (
    <div className="min-h-screen p-8 bg-gray-100">
      <h1 className="text-2xl font-bold mb-6">Dashboard</h1>

      <div className="flex gap-3 mb-6">
        <input
          type="text"
          placeholder="Enter folder name"
          value={folderName}
          onChange={(e) => setFolderName(e.target.value)}
          className="border p-2 rounded w-64 text-black"
        />
        <button
          onClick={createFolder}
          className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
        >
          Create Folder
        </button>

        <button className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700" onClick={() => router.push(`/screen`)}> Screens</button>
      </div>

      <table className="w-full bg-white rounded shadow text-black">
        <thead className="bg-gray-200 text-black">
          <tr>
            <th className="p-3 text-left" >ID</th>
            <th className="p-3 text-left">Folder Name</th>
            <th className="p-3 text-left">Action</th>
          </tr>
        </thead>

        <tbody>
          {loading ? (
            <tr>
              <td colSpan={3} className="text-center p-6">
                Loading...
              </td>
            </tr>
          ) : error ? (
            <tr>
              <td colSpan={3} className="text-center p-6 text-red-500">
                {error}
              </td>
            </tr>
          ) : folders.length === 0 ? (
            <tr>
              <td colSpan={3} className="text-center p-6 text-gray-500">
                No Folder Found
              </td>
            </tr>
          ) : (
            folders.map((folder) => (
              <tr key={folder.id} className="border-t">
                <td className="p-3">{folder.id}</td>
                <td className="p-3">{folder.name}</td>
                <td className="p-3">
                  <a
                    href={`/folder/${folder.id}`}
                    className="text-blue-600 underline"
                  >
                    Upload
                  </a>
                </td>
                {/* <td className="p-3">
                  <a
                    href={`${folder.id}`}
                    className="text-blue-600 underline"
                  >
                    preview
                  </a>
                </td> */}
                <td className="p-3">
                  <a
                    href="#"
                    onClick={handleAddScreen}
                    className="text-blue-600 underline"
                  >
                    addScreen
                  </a>
                </td>
                <td className="p-3">
  {verifiedRows[folder.id] ? (
    <span className="text-green-600 font-semibold">✔ Verified</span>
  ) : (
    <div className="flex gap-2">
      <input
        type="text"
        placeholder="Enter code"
        value={verifyInputs[folder.id] || ""}
        onChange={(e) =>
          handleInputChange(folder.id, e.target.value)
        }
        className="border p-1 text-black"
      />
      <button
        onClick={() => handleVerify(folder.id)}
        className="bg-green-600 text-white px-2 py-1 rounded"
      >
        Verify
      </button>
    </div>
  )}
</td>
              </tr>
            ))
          )}
        </tbody>
      </table>


    </div>
  );
}
