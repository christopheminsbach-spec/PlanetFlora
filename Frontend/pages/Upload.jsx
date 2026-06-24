import { useState } from "react";
import api from "../api";

export default function Upload() {
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [progress, setProgress] = useState(0);
  const [result, setResult] = useState(null);

  const handleFile = (e) => {
    const f = e.target.files[0];
    setFile(f);
    setPreview(URL.createObjectURL(f));
  };

  await api.post("http://localhost:3000/plants/identify", formData)

  const upload = async () => {
    const form = new FormData();
    form.append("image", file);

    const res = await api.post("/plants/identify", form, {
      onUploadProgress: (e) => {
        setProgress(Math.round((e.loaded * 100) / e.total));
      }
    });

    setResult(res.data);
  };

  return (
    <div>
      <h1>📤 Upload</h1>

      <input type="file" onChange={handleFile} />

      {preview && (
        <img src={preview} width={200} style={{ marginTop: 10 }} />
      )}

      {progress > 0 && <p>Progress: {progress}%</p>}

      <button onClick={upload}>Analyze</button>

      {result && <pre>{JSON.stringify(result, null, 2)}</pre>}
    </div>
  );
}