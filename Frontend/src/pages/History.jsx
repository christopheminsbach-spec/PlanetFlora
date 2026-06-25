import { useEffect, useState } from "react";
import api from "../api";

function confidencePercent(value) {
  return `${Math.round(Number(value || 0) * 100)}%`;
}

function formatDate(value) {
  if (!value) return "Date inconnue";

  return new Date(value).toLocaleString("fr-FR", {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

export default function History() {
  const [plants, setPlants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState(null);
  const [error, setError] = useState("");

  async function loadHistory() {
    try {
      setLoading(true);
      setError("");

      const response = await api.get("/plants");

      setPlants(Array.isArray(response.data) ? response.data : []);
    } catch (err) {
      console.error(err);

      setError(
        err.response?.data?.message ||
          "Impossible de charger l'historique. Vérifie que le backend est démarré sur le port 3000."
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadHistory();
  }, []);

  async function deletePlant(id) {
    const confirmed = window.confirm(
      "Supprimer cette analyse de l'historique ?"
    );

    if (!confirmed) return;

    try {
      setDeletingId(id);
      setError("");

      await api.delete(`/plants/${id}`);

      setPlants((currentPlants) =>
        currentPlants.filter((plant) => plant.id !== id)
      );
    } catch (err) {
      console.error(err);

      setError(
        err.response?.data?.message ||
          "Impossible de supprimer cette analyse."
      );
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <section style={{ maxWidth: 1000 }}>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          gap: 16,
          flexWrap: "wrap",
        }}
      >
        <div>
          <h1 style={{ marginBottom: 6 }}>🕘 Historique</h1>
          <p style={{ marginTop: 0 }}>
            Toutes les plantes identifiées depuis cette session.
          </p>
        </div>

        <button
          type="button"
          onClick={loadHistory}
          disabled={loading}
          style={{
            padding: "10px 14px",
            border: 0,
            borderRadius: 8,
            background: "#1b5e20",
            color: "white",
            cursor: loading ? "not-allowed" : "pointer",
          }}
        >
          {loading ? "Chargement..." : "Actualiser"}
        </button>
      </div>

      {error && (
        <p
          style={{
            marginTop: 18,
            padding: 12,
            background: "#fee2e2",
            color: "#991b1b",
            borderRadius: 8,
          }}
        >
          {error}
        </p>
      )}

      {loading && <p>Chargement de l'historique...</p>}

      {!loading && !error && plants.length === 0 && (
        <div
          style={{
            marginTop: 20,
            padding: 20,
            background: "white",
            borderRadius: 12,
            border: "1px solid #e5e7eb",
          }}
        >
          <h2>Aucune analyse pour le moment</h2>
          <p>
            Va dans la page Upload, analyse une photo, puis reviens ici.
          </p>
        </div>
      )}

      {!loading && plants.length > 0 && (
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(270px, 1fr))",
            gap: 16,
            marginTop: 20,
          }}
        >
          {plants.map((plant) => (
            <article
              key={plant.id}
              style={{
                background: "white",
                padding: 18,
                borderRadius: 14,
                border: "1px solid #e5e7eb",
                boxShadow: "0 2px 8px rgba(0,0,0,0.06)",
              }}
            >
              <p
                style={{
                  margin: 0,
                  color: "#166534",
                  fontWeight: 700,
                  fontSize: 14,
                }}
              >
                Analyse du {formatDate(plant.createdAt)}
              </p>

              <h2 style={{ marginBottom: 6 }}>
                {plant.name || "Plante identifiée"}
              </h2>

              <p style={{ marginTop: 0, fontStyle: "italic" }}>
                {plant.scientificName || plant.species || "Espèce inconnue"}
              </p>

              <p>
                <strong>Confiance :</strong>{" "}
                {confidencePercent(plant.confidence)}
              </p>

              <p>
                <strong>Famille :</strong> {plant.family || "Non renseignée"}
              </p>

              <p>
                <strong>Genre :</strong> {plant.genus || "Non renseigné"}
              </p>

              {plant.imageName && (
                <p style={{ color: "#6b7280", fontSize: 13 }}>
                  Image : {plant.imageName}
                </p>
              )}

              <button
                type="button"
                onClick={() => deletePlant(plant.id)}
                disabled={deletingId === plant.id}
                style={{
                  marginTop: 10,
                  padding: "9px 12px",
                  border: 0,
                  borderRadius: 8,
                  background: "#b91c1c",
                  color: "white",
                  cursor:
                    deletingId === plant.id ? "not-allowed" : "pointer",
                }}
              >
                {deletingId === plant.id
                  ? "Suppression..."
                  : "Supprimer"}
              </button>
            </article>
          ))}
        </div>
      )}
    </section>
  );
}