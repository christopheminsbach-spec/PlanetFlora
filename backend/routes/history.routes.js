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
          "Impossible de charger l'historique."
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

      setPlants((current) =>
        current.filter((plant) => plant.id !== id)
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
    <section style={{ maxWidth: 1000, margin: "0 auto" }}>
      {/* HEADER */}
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
          <h1>🕘 Historique des plantes</h1>
          <p>Toutes les analyses sauvegardées</p>
        </div>

        <button
          onClick={loadHistory}
          disabled={loading}
          style={{
            padding: "10px 14px",
            borderRadius: 8,
            border: 0,
            background: "#1b5e20",
            color: "white",
            cursor: loading ? "not-allowed" : "pointer",
          }}
        >
          {loading ? "Chargement..." : "Actualiser"}
        </button>
      </div>

      {/* ERROR */}
      {error && (
        <p
          style={{
            marginTop: 15,
            background: "#fee2e2",
            color: "#991b1b",
            padding: 10,
            borderRadius: 8,
          }}
        >
          {error}
        </p>
      )}

      {/* LOADING */}
      {loading && <p>Chargement...</p>}

      {/* EMPTY */}
      {!loading && plants.length === 0 && (
        <div
          style={{
            marginTop: 20,
            padding: 20,
            background: "#fff",
            borderRadius: 12,
            border: "1px solid #e5e7eb",
          }}
        >
          <h2>Aucune analyse</h2>
          <p>Analyse une plante pour voir l’historique ici.</p>
        </div>
      )}

      {/* LIST */}
      {!loading && plants.length > 0 && (
        <div
          style={{
            display: "grid",
            gridTemplateColumns:
              "repeat(auto-fit, minmax(260px, 1fr))",
            gap: 16,
            marginTop: 20,
          }}
        >
          {plants.map((plant) => (
            <article
  key={plant.id}
  style={{
    background: "white",
    padding: 16,
    borderRadius: 14,
    border: "1px solid #e5e7eb",
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
  <h2 style={{ marginBottom: 6 }}>
    {plant.name || "Plante inconnue"}
  </h2>

  {/* 🌿 ESPÈCE */}
  <p style={{ fontStyle: "italic", marginTop: 0 }}>
    {plant.species || "Espèce inconnue"}
  </p>

  {/* 📊 CONFIDENCE */}
  <p>
    <strong>Confiance :</strong>{" "}
    {Math.round(Number(plant.confidence || 0))}%
  </p>

  {/* 🗑 DELETE */}
  <button
    onClick={() => deletePlant(plant.id)}
    style={{
      marginTop: 10,
      padding: "8px 12px",
      border: 0,
      borderRadius: 8,
      background: "#b91c1c",
      color: "white",
    }}
  >
    Supprimer
  </button>
</article>
          ))}
        </div>
      )}
    </section>
  );
}