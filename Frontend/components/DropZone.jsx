import { useState } from "react";
import { uploadPlant } from "../api";

export default function DropZone({ setResults }) {
  const [drag, setDrag] = useState(false);

  const handleDrop = async (e) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];

    const data = await uploadPlant(file);
    setResults(data.results);
  };

  return (
    <div
      onDragOver={(e) => e.preventDefault()}
      onDrop={handleDrop}
      onDragEnter={() => setDrag(true)}
      onDragLeave={() => setDrag(false)}
      className={`dropzone ${drag ? "active" : ""}`}
    >
      📸 Glisse une image ici
    </div>
  );
}