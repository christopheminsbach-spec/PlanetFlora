import { useEffect, useState } from "react";
import api from "../api";

export default function Dashboard() {
  const [plants, setPlants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadPlants() {
      try {
        setLoading(true);
        setError("");

        const response = await api.get("/plants");

        setPlants(Array.isArray(response.data) ? response.data : []);
      } catch (err) {
        console.error(err);
        setError(
          "Impossible de charger les plantes. Vérifie que le backend est lancé sur le port 3000."
        );
      } finally {
        setLoading(false);
      }
    }

    loadPlants();
  }, []);

  return (
    <section>
      <h1>🌿 Dashboard</h1>

      {loading && <p>Chargement des plantes...</p>}

      {error && <p style={{ color: "#b91c1c" }}>{error}</p>}

      {!loading && !error && (
        <>
          <p>Total plantes : <strong>{plants.length}</strong></p>

          {plants.length === 0 ? (
            <p>Aucune plante enregistrée pour le moment.</p>
          ) : (
            <div style={{ display: "grid", gap: 10 }}>
              {plants.map((plant) => (
                <article
                  key={plant.id}
                  style={{
                    background: "white",
                    padding: 14,
                    borderRadius: 10,
                    boxShadow: "0 1px 5px rgba(0,0,0,0.12)",
                  }}
                >
                  <strong>{plant.name || "Plante sans nom"}</strong>
                  <div>{plant.species || "Espèce inconnue"}</div>

                  {plant.confidence !== undefined && (
                    <small>
                      Confiance : {Math.round(Number(plant.confidence) * 100)}%
                    </small>
                  )}
                </article>
              ))}
            </div>
          )}
        </>
      )}
    </section>
  );
}