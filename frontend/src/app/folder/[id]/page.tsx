
"use client";

import { useParams } from "next/navigation";
import { useEffect, useRef, useState } from "react";

interface FileType {
  id: number;
  filename: string;
  path: string;
}

export default function FolderPage() {
  const { id } = useParams();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [files, setFiles] = useState<FileType[]>([]);
  const [loading, setLoading] = useState(true);


  const handleDelete = async (id: number) => {
  try {
    console.log("------------",id);
    await fetch(`https://instructively-liturgistic-madie.ngrok-free.dev/api/files/${id}`, {
      method: "DELETE",
    });

    setFiles(files.filter((file) => file.id !== id));
  } catch (error) {
    console.error("Delete failed", error);
  }
};





  const fetchFiles = async () => {
    try {
      setLoading(true);
      const res = await fetch(
        `https://instructively-liturgistic-madie.ngrok-free.dev/api/files/${id}`,
        {
    method: "GET", // optional for GET, but good practice
    headers: {
      "Content-Type": "application/json",
      "ngrok-skip-browser-warning": "true",
    },
  }
      );
      const data = await res.json();
      setFiles(data);
    } catch (err) {
      console.error("Error fetching files");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (id) fetchFiles();
  }, [id]);

  const openFilePicker = () => {
    fileInputRef.current?.click();
  };

 
  const handleFileChange = async (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;

    const formData = new FormData();
    formData.append("file", selectedFile);
    formData.append("folderId", id as string);

    await fetch(`https://instructively-liturgistic-madie.ngrok-free.dev/api/files/upload`, {
      method: "POST",
      body: formData,
    });

    fetchFiles(); 
  };

  return (
    <div className="min-h-screen p-8 bg-gray-100">
      <h1 className="text-2xl font-bold mb-6">
        Folder {id}
      </h1>
         <button
            onClick={openFilePicker}
            className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700"
          >
            Upload Image / Video
          </button>

    
      <input
        type="file"
        accept="image/*,video/*"
        ref={fileInputRef}
        onChange={handleFileChange}
        className="hidden"
      />

      {loading ? (
        <p>Loading...</p>
      ) : files.length === 0 ? (
        <div className="text-center">
          <p className="mb-4 text-gray-500">
            No images or videos found
          </p>
      
        </div>
      ) : (
       
        <div>
          <div className="grid grid-cols-3 gap-4">
            {files.map((file) => (
              <div
                key={file.id}
                className="bg-white p-2 rounded shadow"
              >
                {file.filename.match(/\.(mp4|webm|ogg)$/i) ? (
                  <video
                    src={`https://instructively-liturgistic-madie.ngrok-free.dev/uploads/${file.filename}`}
                    controls
                    className="w-full h-full object-cover"
                  />
                  
                ) : (
                  <img
                    // src={`http://localhost:3001/uploads/${file.filename}`}
                     src={`https://instructively-liturgistic-madie.ngrok-free.dev/uploads/${file.filename}`}

                    alt={file.filename}
                    className="w-full h-full object-cover"
                  />
                )
                
                }
                
                
        <button
          onClick={() => handleDelete(file.id)}
          className="absolute top-2 right-2 bg-red-600 text-white text-xs px-2 py-1 rounded hover:bg-red-700"
        >
          Delete
        </button>
              </div>
            ))}
          </div>

        
        </div>
      )}
    </div>
  );
}
