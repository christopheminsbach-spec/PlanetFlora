import { useState } from "react";

export default function Predict() {
  const [result, setResult] = useState(null);

  const API_KEY = "2b10IghA3Wd3PtQX4Nphkeyu"; // 👈 ICI ta clé

  const handleFile = async (e) => {
    const file = e.target.files[0];

    console.log("API KEY =", API_KEY); // 🧠 DEBUG ICI

    const form = new FormData();
    form.append("images", file);

    const res = await fetch(
      `https://my-api.plantnet.org/v2/identify/all?api-key=${API_KEY}`,
      {
        method: "POST",
        body: form,
      }
    );

    const data = await res.json();
    setResult(data);
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center text-white">
      
      <h1 className="text-2xl mb-4">🌿 Identifier une plante</h1>

      <input
        type="file"
        accept="image/*"
        onChange={handleFile}
        className="mb-4"
      />

      {result && (
        <pre className="text-xs bg-black/40 p-4 rounded-xl max-w-xl overflow-auto">
          {JSON.stringify(result, null, 2)}
        </pre>
      )}
    </div>
  );
}