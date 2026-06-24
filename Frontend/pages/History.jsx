import { useEffect, useState } from "react";
import { getHistory } from "../api";

export default function History() {
  const [data, setData] = useState([]);

  useEffect(() => {
    const load = async () => {
      setData(await getHistory());
    };

    load();
    const interval = setInterval(load, 3000); // LIVE
    return () => clearInterval(interval);
  }, []);

  return (
    <div>
      <h2>🕒 Historique</h2>

      {data.map((item) => (
        <div key={item.id} className="card">
          <h4>{item.plant_name}</h4>
          <p>{(item.confidence * 100).toFixed(2)}%</p>
        </div>
      ))}
    </div>
  );
}