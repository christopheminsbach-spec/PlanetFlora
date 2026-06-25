import { useCallback, useEffect, useState } from "react";
import api from "../api";

const API_URL = "http://localhost:3000";

function formatDate(value) {
  if (!value) return "Date inconnue";

  return new Intl.DateTimeFormat("fr-FR", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

function confidenceLabel(confidence) {
  const value = Number(confidence || 0);

  if (value >= 80) return "Très fiable";
  if (value >= 55) return "Probable";
  return "À vérifier";
}

export default function History() {
  const [plants, setPlants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState(null);
  const [error, setError] = useState("");

  const loadPlants = useCallback(async () => {
    try {
      setLoading(true);
      setError("");

      const response = await api.get("/plants");
      setPlants(Array.isArray(response.data) ? response.data : []);
    } catch (err) {
      setError(
        err.response?.data?.message ||
          "Impossible de charger l’historique des identifications."
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadPlants();
  }, [loadPlants]);

  async function deletePlant(id) {
    const confirmed = window.confirm(
      "Voulez-vous vraiment supprimer cette identification ?"
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
      setError(
        err.response?.data?.message ||
          "Impossible de supprimer cette identification."
      );
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <section style={styles.page}>
      <header style={styles.header}>
        <div>
          <p style={styles.eyebrow}>COLLECTION PERSONNELLE</p>
          <h1 style={styles.title}>Historique des plantes</h1>
          <p style={styles.subtitle}>
            Retrouvez vos analyses, leurs photos et les espèces reconnues.
          </p>
        </div>

        <button type="button" onClick={loadPlants} style={styles.refreshButton}>
          ↻ Actualiser
        </button>
      </header>

      <div style={styles.summary}>
        <div style={styles.summaryIcon}>🌿</div>
        <div>
          <strong style={styles.summaryNumber}>{plants.length}</strong>
          <span style={styles.summaryText}>
            identification{plants.length > 1 ? "s" : ""} enregistrée
            {plants.length > 1 ? "s" : ""}
          </span>
        </div>
      </div>

      {error && <div style={styles.error}>⚠️ {error}</div>}

      {loading ? (
        <div style={styles.emptyState}>
          <div style={styles.loader}>🌱</div>
          <h2>Chargement de votre collection…</h2>
          <p>Les identifications enregistrées arrivent.</p>
        </div>
      ) : plants.length === 0 ? (
        <div style={styles.emptyState}>
          <div style={styles.emptyIcon}>📷</div>
          <h2>Aucune identification enregistrée</h2>
          <p>
            Importez une photo depuis la page Upload pour commencer votre
            collection botanique.
          </p>
        </div>
      ) : (
        <div style={styles.grid}>
          {plants.map((plant) => {
            const confidence = Number(plant.confidence || 0);
            const imageSrc = plant.imageUrl
              ? `${API_URL}${plant.imageUrl}`
              : null;

            return (
              <article key={plant.id} style={styles.card}>
                <div style={styles.imageContainer}>
                  {imageSrc ? (
                    <img
                      src={imageSrc}
                      alt={plant.name || plant.species || "Plante identifiée"}
                      style={styles.image}
                      onError={(event) => {
                        event.currentTarget.style.display = "none";
                        event.currentTarget.nextElementSibling.style.display =
                          "flex";
                      }}
                    />
                  ) : null}

                  <div
                    style={{
                      ...styles.imageFallback,
                      display: imageSrc ? "none" : "flex",
                    }}
                  >
                    🌿
                    <span>Image indisponible</span>
                  </div>

                  <div style={styles.confidenceBadge}>
                    <span>{confidence.toFixed(1)}%</span>
                    <small>{confidenceLabel(confidence)}</small>
                  </div>
                </div>

                <div style={styles.cardBody}>
                  <div style={styles.plantHeading}>
                    <div>
                      <p style={styles.commonName}>
                        {plant.name || "Nom inconnu"}
                      </p>
                      <h2 style={styles.species}>
                        {plant.species || "Espèce inconnue"}
                      </h2>
                    </div>

                    <span style={styles.leafIcon}>🌱</span>
                  </div>

                  <div style={styles.divider} />

                  <div style={styles.details}>
                    <div style={styles.detailRow}>
                      <span style={styles.detailIcon}>🕒</span>
                      <div>
                        <span style={styles.detailLabel}>Identifiée le</span>
                        <strong style={styles.detailValue}>
                          {formatDate(plant.createdAt)}
                        </strong>
                      </div>
                    </div>

                    <div style={styles.detailRow}>
                      <span style={styles.detailIcon}>📍</span>
                      <div>
                        <span style={styles.detailLabel}>Position</span>
                        <strong style={styles.detailValue}>
                          {plant.latitude != null && plant.longitude != null
                            ? `${Number(plant.latitude).toFixed(4)}, ${Number(
                                plant.longitude
                              ).toFixed(4)}`
                            : "Non renseignée"}
                        </strong>
                      </div>
                    </div>

                    <div style={styles.detailRow}>
                      <span style={styles.detailIcon}>🆔</span>
                      <div>
                        <span style={styles.detailLabel}>Référence</span>
                        <strong style={styles.detailValue}>#{plant.id}</strong>
                      </div>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => deletePlant(plant.id)}
                    disabled={deletingId === plant.id}
                    style={{
                      ...styles.deleteButton,
                      opacity: deletingId === plant.id ? 0.65 : 1,
                      cursor:
                        deletingId === plant.id ? "not-allowed" : "pointer",
                    }}
                  >
                    {deletingId === plant.id
                      ? "Suppression…"
                      : "🗑 Supprimer l’identification"}
                  </button>
                </div>
              </article>
            );
          })}
        </div>
      )}
    </section>
  );
}

const styles = {
  page: {
    width: "100%",
    maxWidth: 1400,
    margin: "0 auto",
    padding: "8px 0 40px",
    boxSizing: "border-box",
  },

  header: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 20,
    flexWrap: "wrap",
    marginBottom: 24,
  },

  eyebrow: {
    margin: 0,
    color: "#4f8a5b",
    fontSize: 12,
    fontWeight: 800,
    letterSpacing: 1.5,
  },

  title: {
    margin: "6px 0 8px",
    color: "#173d25",
    fontSize: "clamp(28px, 4vw, 42px)",
    lineHeight: 1.1,
  },

  subtitle: {
    margin: 0,
    color: "#607265",
    fontSize: 16,
    lineHeight: 1.5,
  },

  refreshButton: {
    border: "1px solid #cfe2d2",
    background: "#ffffff",
    color: "#246b37",
    borderRadius: 12,
    padding: "12px 16px",
    fontWeight: 700,
    fontSize: 14,
    cursor: "pointer",
    boxShadow: "0 4px 12px rgba(27, 94, 32, 0.08)",
  },

  summary: {
    display: "inline-flex",
    alignItems: "center",
    gap: 12,
    padding: "14px 18px",
    borderRadius: 16,
    background: "linear-gradient(135deg, #e6f6e9, #f8fff8)",
    border: "1px solid #cce8d2",
    marginBottom: 26,
  },

  summaryIcon: {
    width: 42,
    height: 42,
    display: "grid",
    placeItems: "center",
    borderRadius: 12,
    background: "#2f7d43",
    fontSize: 22,
  },

  summaryNumber: {
    display: "block",
    color: "#1d5b2d",
    fontSize: 22,
    lineHeight: 1,
  },

  summaryText: {
    display: "block",
    color: "#53715a",
    fontSize: 13,
    marginTop: 4,
  },

  error: {
    marginBottom: 22,
    padding: "14px 16px",
    borderRadius: 12,
    background: "#fff1f1",
    border: "1px solid #ffcaca",
    color: "#a52626",
    fontWeight: 600,
  },

  grid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
    gap: 22,
  },

  card: {
    overflow: "hidden",
    borderRadius: 20,
    background: "#ffffff",
    border: "1px solid #e5eee6",
    boxShadow: "0 12px 30px rgba(25, 69, 36, 0.09)",
    transition: "transform 180ms ease, box-shadow 180ms ease",
  },

  imageContainer: {
    position: "relative",
    height: 220,
    overflow: "hidden",
    background: "#eaf3eb",
  },

  image: {
    width: "100%",
    height: "100%",
    objectFit: "cover",
    display: "block",
  },

  imageFallback: {
    width: "100%",
    height: "100%",
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "column",
    gap: 8,
    color: "#52745a",
    fontSize: 16,
    background:
      "radial-gradient(circle at 30% 20%, #f6fff7 0, #dff0e2 48%, #c7e1cb 100%)",
  },

  confidenceBadge: {
    position: "absolute",
    top: 14,
    right: 14,
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    padding: "8px 10px",
    borderRadius: 12,
    color: "#ffffff",
    background: "rgba(21, 75, 35, 0.88)",
    backdropFilter: "blur(8px)",
    fontWeight: 800,
    fontSize: 14,
  },

  cardBody: {
    padding: 20,
  },

  plantHeading: {
    display: "flex",
    justifyContent: "space-between",
    gap: 12,
    alignItems: "flex-start",
  },

  commonName: {
    margin: 0,
    color: "#214b2d",
    fontSize: 20,
    fontWeight: 800,
  },

  species: {
    margin: "5px 0 0",
    color: "#6a7d6e",
    fontSize: 14,
    fontStyle: "italic",
    fontWeight: 600,
    lineHeight: 1.4,
  },

  leafIcon: {
    display: "grid",
    placeItems: "center",
    width: 38,
    height: 38,
    borderRadius: 12,
    background: "#edf8ef",
    fontSize: 19,
  },

  divider: {
    height: 1,
    background: "#edf1ed",
    margin: "18px 0",
  },

  details: {
    display: "grid",
    gap: 14,
  },

  detailRow: {
    display: "flex",
    alignItems: "center",
    gap: 10,
  },

  detailIcon: {
    width: 32,
    height: 32,
    display: "grid",
    placeItems: "center",
    borderRadius: 10,
    background: "#f2f8f3",
    fontSize: 15,
  },

  detailLabel: {
    display: "block",
    color: "#849489",
    fontSize: 11,
    fontWeight: 700,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },

  detailValue: {
    display: "block",
    color: "#38533f",
    fontSize: 13,
    marginTop: 2,
    wordBreak: "break-word",
  },

  deleteButton: {
    width: "100%",
    marginTop: 20,
    border: "1px solid #ffd0d0",
    borderRadius: 12,
    padding: "11px 14px",
    background: "#fff7f7",
    color: "#bd3030",
    fontWeight: 800,
    fontSize: 13,
  },

  emptyState: {
    minHeight: 300,
    display: "flex",
    flexDirection: "column",
    justifyContent: "center",
    alignItems: "center",
    textAlign: "center",
    padding: 30,
    borderRadius: 20,
    border: "1px dashed #b9d8be",
    background: "#fbfffb",
    color: "#58705e",
  },

  emptyIcon: {
    fontSize: 48,
    marginBottom: 8,
  },

  loader: {
    fontSize: 44,
    marginBottom: 8,
  },
};