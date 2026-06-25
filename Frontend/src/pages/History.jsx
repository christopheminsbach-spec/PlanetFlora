import { useEffect, useState } from "react";
import api from "../api";

export default function History() {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    api
      .get("/history")
      .then((response) => {
        setHistory(Array.isArray(response.data) ? response.data : []);
      })
      .catch((err) => {
        setError(
          err.response?.data?.message ||
            "Impossible de charger l'historique."
        );
      })
      .finally(() => {
        setLoading(false);
      });
  }, []);

  if (loading) {
    return <p>Chargement de l’historique…</p>;
  }

  return (
    <section>
      <h1>🕘 Historique des identifications</h1>

      {error && <p style={{ color: "#b91c1c" }}>{error}</p>}

      {history.length === 0 ? (
        <p>Aucune analyse enregistrée pour le moment.</p>
      ) : (
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
            gap: 16,
          }}
        >
          {history.map((plant) => (
            <article
              key={plant.id}
              style={{
                background: "white",
                borderRadius: 14,
                overflow: "hidden",
                boxShadow: "0 3px 12px rgba(0,0,0,0.08)",
              }}
            >
              {plant.imagePath && (
                <img
                  src={`http://localhost:3000${plant.imagePath}`}
                  alt={plant.name}
                  style={{
                    width: "100%",
                    height: 170,
                    objectFit: "cover",
                    display: "block",
                  }}
                />
              )}

              <div style={{ padding: 16 }}>
                <h2 style={{ marginTop: 0, fontSize: 18 }}>
                  {plant.name}
                </h2>

                <p style={{ fontStyle: "italic" }}>
                  {plant.species}
                </p>

                <p>
                  Confiance : <strong>{plant.confidence}%</strong>
                </p>

                <small>
                  {plant.createdAt
                    ? new Date(plant.createdAt).toLocaleString("fr-FR")
                    : ""}
                </small>
              </div>
            </article>
          ))}
        </div>
      )}
    </section>
  );
}