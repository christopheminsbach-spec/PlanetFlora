import { useEffect, useState } from "react";
import api from "../api";

export default function History() {
  const [plants, setPlants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [deletingId, setDeletingId] = useState(null);

  async function loadHistory() {
    try {
      setLoading(true);
      setError("");

      const res = await api.get("/plants");

      setPlants(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      console.error(err);
      setError("Impossible de charger l'historique");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadHistory();
  }, []);

  async function deletePlant(id) {
    if (!window.confirm("Supprimer cette analyse ?")) return;

    try {
      setDeletingId(id);

      await api.delete(`/plants/${id}`);

      setPlants((prev) => prev.filter((p) => p.id !== id));
    } catch (err) {
      console.error(err);
      setError("Erreur suppression");
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <div style={{ maxWidth: 1000, margin: "0 auto" }}>
      <h1>🕘 Historique des plantes</h1>

      {error && <p style={{ color: "red" }}>{error}</p>}

      {loading && <p>Chargement...</p>}

      {!loading && plants.length === 0 && (
        <p>Aucune analyse pour le moment</p>
      )}

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))",
          gap: 16,
          marginTop: 20,
        }}
      >
        {plants.map((plant) => (
          <div
            key={plant.id}
            style={{
              border: "1px solid #ddd",
              borderRadius: 12,
              padding: 12,
              background: "#fff",
            }}
          >
            {/* 🌿 IMAGE */}
            {plant.imagePath && (
              <img
                src={`http://localhost:3000${plant.imagePath}`}
                alt={plant.name}
                style={{
                  width: "100%",
                  height: 180,
                  objectFit: "cover",
                  borderRadius: 10,
                  marginBottom: 10,
                }}
              />
            )}

            {/* 🌱 NOM */}
            <h3>{plant.name || "Plante inconnue"}</h3>

            {/* 🔬 ESPÈCE */}
            <p style={{ fontStyle: "italic" }}>
              {plant.species || "Espèce inconnue"}
            </p>

            {/* 📊 CONFIDENCE */}
            <p>
              Confiance:{" "}
              {Math.round(Number(plant.confidence || 0))}%
            </p>

            {/* 🗑 DELETE */}
            <button
              onClick={() => deletePlant(plant.id)}
              disabled={deletingId === plant.id}
              style={{
                marginTop: 10,
                background: "red",
                color: "white",
                border: 0,
                padding: "8px 12px",
                borderRadius: 8,
                cursor: "pointer",
              }}
            >
              {deletingId === plant.id
                ? "Suppression..."
                : "Supprimer"}
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}