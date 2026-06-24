import { useEffect, useState } from "react";
import api from "../api";

export default function History() {
  const [data, setData] = useState([]);

  useEffect(() => {
    api.get("/history?page=1").then(res => setData(res.data));
  }, []);

  return (
    <div>
      <h1>History</h1>

      {data.map((item) => (
        <div key={item.id}>
          🌿 {item.species_name} - {item.confidence}
        </div>
      ))}
    </div>
  );
}