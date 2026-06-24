import { useEffect, useState } from "react";
import api from "../api";

export default function Dashboard() {
  const [stats, setStats] = useState([]);
  const [error, setError] = useState("");

  useEffect(() => {
    api
      .get("/stats")
      .then((res) => {
        setStats(res.data);
      })
      .catch((err) => {
        console.error("Erreur API /stats :", err);
        setError(
          "Impossible de charger les statistiques. Vérifie que le backend fonctionne sur le port 5000."
        );
      });
  }, []);

  return (
    <div>
      <h1>🌿 Tableau de bord</h1>

      <p>Bienvenue sur Planète Flora.</p>

      {error && (
        <p style={{ color: "crimson", fontWeight: "bold" }}>
          {error}
        </p>
      )}

      {!error && stats.length === 0 && (
        <p>Aucune identification enregistrée pour le moment.</p>
      )}

      {stats.length > 0 && (
        <ul>
          {stats.map((item, index) => (
            <li key={index}>
              {item.date} : {item.total} identification(s)
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
