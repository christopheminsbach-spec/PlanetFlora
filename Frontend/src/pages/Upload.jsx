import { useMemo, useState } from "react";
import api from "../api";

function normalizePredictions(data) {
  const rawResults =
    data?.results ||
    data?.predictions ||
    data?.data?.results ||
    data?.data?.predictions ||
    [];

  if (!Array.isArray(rawResults)) return [];

  return rawResults.map((item, index) => {
    const species =
      item.species ||
      item.scientificName ||
      item.scientific_name ||
      item.name ||
      item?.species?.scientificName ||
      item?.species?.scientific_name ||
      "Espèce inconnue";

    const commonName =
      item.commonName ||
      item.common_name ||
      item?.species?.commonNames?.[0] ||
      item?.species?.common_name ||
      "Nom commun non disponible";

    const confidenceRaw =
      item.confidence ??
      item.score ??
      item.probability ??
      item?.score ??
      0;

    const confidence =
      confidenceRaw <= 1
        ? Math.round(confidenceRaw * 100)
        : Math.round(confidenceRaw);

    const family =
      item.family ||
      item?.species?.family?.scientificName ||
      item?.species?.family ||
      "Famille non disponible";

    const genus =
      item.genus ||
      item?.species?.genus?.scientificName ||
      item?.species?.genus ||
      "Genre non disponible";

    return {
      id: item.id || `${species}-${index}`,
      rank: index + 1,
      species,
      commonName,
      confidence: Math.max(0, Math.min(confidence, 100)),
      family,
      genus,
      description:
        item.description ||
        `Cette proposition est basée sur les éléments visibles dans votre photo.`,
    };
  });
}

function confidenceLabel(confidence) {
  if (confidence >= 85) return "Très probable";
  if (confidence >= 65) return "Probable";
  if (confidence >= 40) return "À vérifier";
  return "Peu probable";
}

function confidenceColor(confidence) {
  if (confidence >= 85) return "#15803d";
  if (confidence >= 65) return "#65a30d";
  if (confidence >= 40) return "#d97706";
  return "#dc2626";
}

export default function Upload() {
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState("");
  const [predictions, setPredictions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState("");

  const bestPrediction = useMemo(() => predictions[0], [predictions]);

  function handleFileChange(event) {
    const selectedFile = event.target.files?.[0];

    setPredictions([]);
    setError("");
    setProgress(0);

    if (!selectedFile) {
      setFile(null);
      setPreview("");
      return;
    }

    if (!selectedFile.type.startsWith("image/")) {
      setFile(null);
      setPreview("");
      setError("Veuillez sélectionner une image (JPG, PNG, WEBP…).");
      return;
    }

    setFile(selectedFile);
    setPreview(URL.createObjectURL(selectedFile));
  }

  async function analyzePlant() {
    if (!file) {
      setError("Choisissez une photo de plante avant de lancer l’analyse.");
      return;
    }

    try {
      setLoading(true);
      setProgress(0);
      setError("");
      setPredictions([]);

      const formData = new FormData();
      formData.append("image", file);

      const response = await api.post("/plants/identify", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
        onUploadProgress: (event) => {
          if (!event.total) return;
          setProgress(Math.round((event.loaded * 100) / event.total));
        },
      });

      const formattedPredictions = normalizePredictions(response.data);

      if (formattedPredictions.length === 0) {
        setError(
          "Aucune prédiction reçue. Vérifie que le backend renvoie bien un tableau results."
        );
        return;
      }

      setPredictions(formattedPredictions);
      setProgress(100);
    } catch (err) {
      setError(
        err.response?.data?.message ||
          err.response?.data?.error ||
          "Analyse impossible. Vérifie que le backend fonctionne sur http://localhost:3000."
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <section style={styles.page}>
      <div style={styles.hero}>
        <div>
          <p style={styles.badge}>IDENTIFICATION PAR IMAGE</p>
          <h1 style={styles.title}>Identifier une plante</h1>
          <p style={styles.subtitle}>
            Importe une photo. L’API Pl@ntNet proposera les espèces les plus
            probables avec un niveau de confiance.
          </p>
        </div>

        <div style={styles.heroIcon}>🔎🌿</div>
      </div>

      <div style={styles.grid}>
        <article style={styles.uploadCard}>
          <h2 style={styles.cardTitle}>Importer une photo</h2>
          <p style={styles.cardText}>
            Une photo nette de la feuille, fleur ou plante entière améliore le
            résultat.
          </p>

          <label style={styles.fileZone}>
            <input
              type="file"
              accept="image/*"
              onChange={handleFileChange}
              style={{ display: "none" }}
            />

            <span style={{ fontSize: 42 }}>📷</span>
            <strong>Choisir une image</strong>
            <span style={styles.fileHint}>JPG, PNG, WEBP</span>
          </label>

          {file && (
            <div style={styles.selectedFile}>
              <span>📎</span>
              <span>{file.name}</span>
              <span style={styles.fileSize}>
                {(file.size / 1024 / 1024).toFixed(2)} Mo
              </span>
            </div>
          )}

          <button
            type="button"
            onClick={analyzePlant}
            disabled={!file || loading}
            style={{
              ...styles.analyzeButton,
              opacity: !file || loading ? 0.65 : 1,
              cursor: !file || loading ? "not-allowed" : "pointer",
            }}
          >
            {loading ? "Analyse en cours…" : "🌿 Analyser la plante"}
          </button>

          {loading && (
            <div style={styles.progressArea}>
              <div style={styles.progressLabels}>
                <span>Envoi et analyse de l’image…</span>
                <strong>{progress}%</strong>
              </div>

              <div style={styles.progressTrack}>
                <div
                  style={{
                    ...styles.progressBar,
                    width: `${Math.max(progress, 8)}%`,
                  }}
                />
              </div>
            </div>
          )}

          {error && <div style={styles.errorBox}>⚠️ {error}</div>}
        </article>

        <article style={styles.previewCard}>
          <h2 style={styles.cardTitle}>Aperçu de la plante</h2>

          {preview ? (
            <img src={preview} alt="Aperçu de la plante" style={styles.image} />
          ) : (
            <div style={styles.emptyPreview}>
              <span style={{ fontSize: 52 }}>🌱</span>
              <p>Votre image apparaîtra ici.</p>
            </div>
          )}
        </article>
      </div>

      {bestPrediction && (
        <section style={styles.bestCard}>
          <div style={styles.bestHeader}>
            <div>
              <p style={styles.badgeGreen}>MEILLEURE PRÉDICTION</p>
              <h2 style={styles.bestTitle}>{bestPrediction.species}</h2>
              <p style={styles.commonName}>{bestPrediction.commonName}</p>
            </div>

            <div
              style={{
                ...styles.confidenceCircle,
                borderColor: confidenceColor(bestPrediction.confidence),
              }}
            >
              <strong>{bestPrediction.confidence}%</strong>
              <span>confiance</span>
            </div>
          </div>

          <div style={styles.detailsGrid}>
            <div style={styles.detailItem}>
              <span>🌿 Genre</span>
              <strong>{bestPrediction.genus}</strong>
            </div>

            <div style={styles.detailItem}>
              <span>🧬 Famille</span>
              <strong>{bestPrediction.family}</strong>
            </div>

            <div style={styles.detailItem}>
              <span>🎯 Fiabilité</span>
              <strong>{confidenceLabel(bestPrediction.confidence)}</strong>
            </div>
          </div>

          <p style={styles.description}>{bestPrediction.description}</p>
        </section>
      )}

      {predictions.length > 0 && (
        <section style={styles.resultsSection}>
          <div style={styles.resultsHeader}>
            <div>
              <p style={styles.badgeGreen}>RÉSULTATS</p>
              <h2 style={styles.resultsTitle}>Espèces proposées</h2>
            </div>

            <span style={styles.resultsCount}>
              {predictions.length} proposition(s)
            </span>
          </div>

          <div style={styles.predictionsList}>
            {predictions.map((prediction) => (
              <article key={prediction.id} style={styles.predictionCard}>
                <div style={styles.rank}>{prediction.rank}</div>

                <div style={{ flex: 1 }}>
                  <div style={styles.predictionTop}>
                    <div>
                      <h3 style={styles.predictionName}>
                        {prediction.species}
                      </h3>
                      <p style={styles.predictionCommon}>
                        {prediction.commonName}
                      </p>
                    </div>

                    <span
                      style={{
                        ...styles.confidenceTag,
                        color: confidenceColor(prediction.confidence),
                        background: `${confidenceColor(prediction.confidence)}18`,
                      }}
                    >
                      {prediction.confidence}% —{" "}
                      {confidenceLabel(prediction.confidence)}
                    </span>
                  </div>

                  <div style={styles.meterTrack}>
                    <div
                      style={{
                        ...styles.meterBar,
                        width: `${prediction.confidence}%`,
                        background: confidenceColor(prediction.confidence),
                      }}
                    />
                  </div>

                  <div style={styles.metaRow}>
                    <span>
                      <strong>Genre :</strong> {prediction.genus}
                    </span>
                    <span>
                      <strong>Famille :</strong> {prediction.family}
                    </span>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </section>
      )}
    </section>
  );
}

const styles = {
  page: {
    maxWidth: 1250,
    margin: "0 auto",
  },

  hero: {
    padding: 32,
    borderRadius: 22,
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 20,
    color: "white",
    background: "linear-gradient(135deg, #14532d, #15803d)",
    boxShadow: "0 15px 35px rgba(20, 83, 45, 0.2)",
  },

  badge: {
    margin: 0,
    fontSize: 11,
    fontWeight: 800,
    letterSpacing: 1.2,
    color: "#dcfce7",
  },

  badgeGreen: {
    margin: 0,
    color: "#16a34a",
    fontSize: 11,
    fontWeight: 800,
    letterSpacing: 1.2,
  },

  title: {
    margin: "10px 0",
    fontSize: "clamp(30px, 5vw, 44px)",
  },

  subtitle: {
    maxWidth: 680,
    margin: 0,
    lineHeight: 1.6,
    color: "rgba(255,255,255,0.85)",
  },

  heroIcon: {
    fontSize: 60,
    minWidth: 110,
    textAlign: "center",
  },

  grid: {
    display: "grid",
    gridTemplateColumns: "minmax(280px, 1fr) minmax(280px, 1fr)",
    gap: 20,
    marginTop: 22,
  },

  uploadCard: {
    padding: 25,
    borderRadius: 18,
    background: "white",
    boxShadow: "0 6px 18px rgba(0,0,0,0.07)",
  },

  previewCard: {
    padding: 25,
    borderRadius: 18,
    background: "white",
    boxShadow: "0 6px 18px rgba(0,0,0,0.07)",
  },

  cardTitle: {
    margin: 0,
    color: "#163020",
    fontSize: 22,
  },

  cardText: {
    color: "#64748b",
    lineHeight: 1.55,
  },

  fileZone: {
    minHeight: 180,
    marginTop: 18,
    padding: 20,
    display: "grid",
    placeItems: "center",
    gap: 8,
    textAlign: "center",
    color: "#166534",
    border: "2px dashed #86efac",
    borderRadius: 16,
    background: "#f0fdf4",
    cursor: "pointer",
  },

  fileHint: {
    color: "#64748b",
    fontSize: 13,
  },

  selectedFile: {
    marginTop: 14,
    padding: 12,
    display: "flex",
    alignItems: "center",
    gap: 8,
    borderRadius: 10,
    color: "#334155",
    background: "#f8fafc",
    fontSize: 14,
  },

  fileSize: {
    marginLeft: "auto",
    color: "#64748b",
  },

  analyzeButton: {
    width: "100%",
    marginTop: 18,
    padding: "14px 16px",
    border: "none",
    borderRadius: 11,
    color: "white",
    background: "#15803d",
    fontSize: 16,
    fontWeight: 800,
  },

  progressArea: {
    marginTop: 18,
  },

  progressLabels: {
    display: "flex",
    justifyContent: "space-between",
    marginBottom: 8,
    color: "#475569",
    fontSize: 13,
  },

  progressTrack: {
    height: 10,
    overflow: "hidden",
    borderRadius: 99,
    background: "#e2e8f0",
  },

  progressBar: {
    height: "100%",
    borderRadius: 99,
    background: "#16a34a",
    transition: "width 0.25s ease",
  },

  errorBox: {
    marginTop: 16,
    padding: 13,
    borderRadius: 10,
    color: "#991b1b",
    background: "#fef2f2",
    border: "1px solid #fecaca",
  },

  image: {
    width: "100%",
    height: 290,
    objectFit: "cover",
    borderRadius: 14,
    marginTop: 18,
  },

  emptyPreview: {
    minHeight: 290,
    marginTop: 18,
    display: "grid",
    placeItems: "center",
    textAlign: "center",
    color: "#64748b",
    borderRadius: 14,
    background: "#f8faf8",
    border: "1px solid #e5eee5",
  },

  bestCard: {
    marginTop: 22,
    padding: 28,
    borderRadius: 20,
    background: "white",
    border: "1px solid #bbf7d0",
    boxShadow: "0 8px 24px rgba(20, 83, 45, 0.09)",
  },

  bestHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 20,
  },

  bestTitle: {
    margin: "8px 0 4px",
    color: "#14532d",
    fontSize: 30,
  },

  commonName: {
    margin: 0,
    color: "#64748b",
    fontSize: 16,
  },

  confidenceCircle: {
    width: 105,
    height: 105,
    display: "grid",
    placeItems: "center",
    alignContent: "center",
    border: "7px solid",
    borderRadius: "50%",
    color: "#14532d",
  },

  detailsGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
    gap: 12,
    marginTop: 25,
  },

  detailItem: {
    padding: 14,
    display: "grid",
    gap: 6,
    borderRadius: 12,
    color: "#475569",
    background: "#f8fafc",
  },

  description: {
    margin: "22px 0 0",
    color: "#475569",
    lineHeight: 1.6,
  },

  resultsSection: {
    marginTop: 22,
    padding: 28,
    borderRadius: 20,
    background: "white",
    boxShadow: "0 6px 18px rgba(0,0,0,0.07)",
  },

  resultsHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 15,
    marginBottom: 20,
  },

  resultsTitle: {
    margin: "7px 0 0",
    color: "#163020",
    fontSize: 26,
  },

  resultsCount: {
    padding: "8px 11px",
    borderRadius: 99,
    color: "#166534",
    background: "#dcfce7",
    fontWeight: 700,
    fontSize: 13,
  },

  predictionsList: {
    display: "grid",
    gap: 14,
  },

  predictionCard: {
    display: "flex",
    gap: 15,
    padding: 18,
    borderRadius: 14,
    background: "#fafdf9",
    border: "1px solid #e5eee5",
  },

  rank: {
    minWidth: 34,
    height: 34,
    display: "grid",
    placeItems: "center",
    borderRadius: "50%",
    color: "white",
    background: "#15803d",
    fontWeight: 800,
  },

  predictionTop: {
    display: "flex",
    justifyContent: "space-between",
    gap: 12,
  },

  predictionName: {
    margin: 0,
    color: "#1f2937",
    fontSize: 18,
  },

  predictionCommon: {
    margin: "4px 0 0",
    color: "#64748b",
    fontSize: 14,
  },

  confidenceTag: {
    height: "fit-content",
    padding: "7px 9px",
    borderRadius: 99,
    fontWeight: 800,
    fontSize: 12,
    whiteSpace: "nowrap",
  },

  meterTrack: {
    height: 8,
    overflow: "hidden",
    marginTop: 15,
    borderRadius: 99,
    background: "#e2e8f0",
  },

  meterBar: {
    height: "100%",
    borderRadius: 99,
  },

  metaRow: {
    display: "flex",
    flexWrap: "wrap",
    gap: 15,
    marginTop: 13,
    color: "#64748b",
    fontSize: 13,
  },
};