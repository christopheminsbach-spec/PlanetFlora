import { useState } from "react";
import DropZone from "../components/DropZone";

export default function Identify() {
  const [results, setResults] = useState([]);

  return (
    <div>
      <h2>🌿 Identification IA</h2>

      <DropZone setResults={setResults} />

      <div className="grid">
        {results.map((r, i) => (
          <div key={i} className="card">
            <img src={r.image} width="120" />
            <h3>{r.name}</h3>
            <p>{(r.score * 100).toFixed(2)}%</p>
          </div>
        ))}
      </div>
    </div>
  );
}