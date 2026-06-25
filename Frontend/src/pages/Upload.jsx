import { useRef, useState } from "react";
import api from "../api";

function getErrorMessage(error) {
  return (
    error?.response?.data?.message ||
    error?.response?.data?.details ||
    error?.message ||
    "Erreur pendant l'identification de la plante."
  );
}

function formatConfidence(value) {
  const number = Number(value);

  if (Number.isNaN(number)) {
    return "Non disponible";
  }

  return `${number.toFixed(1)} %`;
}

export default function Upload() {
  const inputRef = useRef(null);

  const [file, setFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [results, setResults] = useState([]);

  const handleFileChange = (event) => {
    const selectedFile = event.target.files?.[0];

    setError("");
    setSuccessMessage("");
    setResults([]);
    setProgress(0);

    if (!selectedFile) {
      setFile(null);
      setPreviewUrl("");
      return;
    }

    const acceptedTypes = ["image/jpeg", "image/png", "image/webp"];

    if (!acceptedTypes.includes(selectedFile.type)) {
      setFile(null);
      setPreviewUrl("");
      setError("Choisis une image JPG, PNG ou WEBP.");
      return;
    }

    if (selectedFile.size > 10 * 1024 * 1024) {
      setFile(null);
      setPreviewUrl("");
      setError("L'image est trop lourde. Taille maximale : 10 Mo.");
      return;
    }

    setFile(selectedFile);
    setPreviewUrl(URL.createObjectURL(selectedFile));
  };

  const removeFile = () => {
    setFile(null);
    setPreviewUrl("");
    setProgress(0);
    setError("");
    setSuccessMessage("");
    setResults([]);

    if (inputRef.current) {
      inputRef.current.value = "";
    }
  };

  const analyzePlant = async () => {
    if (!file) {
      setError("Choisis une image avant de lancer l'analyse.");
      return;
    }

    const formData = new FormData();
    formData.append("image", file);

    setLoading(true);
    setProgress(0);
    setError("");
    setSuccessMessage("");
    setResults([]);

    try {
      const response = await api.post("/plants/identify", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
        onUploadProgress: (event) => {
          if (!event.total) {
            return;
          }

          const percent = Math.round((event.loaded * 100) / event.total);
          setProgress(percent);
        },
      });

      const receivedResults = Array.isArray(response.data?.results)
        ? response.data.results
        : [];

      setResults(receivedResults);
      setProgress(100);

      if (receivedResults.length > 0) {
        setSuccessMessage(
          response.data?.historyWarning ||
            "Analyse terminée. La prédiction a été ajoutée à l'historique."
        );
      } else {
        setError("Aucun résultat n'a été retourné par l'API.");
      }
    } catch (err) {
      console.error("Erreur analyse :", err);
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <section style={styles.page}>
      <div style={styles.header}>
        <div>
          <p style={styles.eyebrow}>IDENTIFICATION INTELLIGENTE</p>
          <h1 style={styles.title}>Identifier une plante</h1>
          <p style={styles.subtitle}>
            Importe une photo : l’API Pl@ntNet proposera les espèces les plus
            probables.
          </p>
        </div>
      </div>

      <div style={styles.grid}>
        <div style={styles.card}>
          <h2 style={styles.cardTitle}>Importer une photo</h2>
          <p style={styles.cardText}>
            Une photo nette de la feuille, fleur ou plante entière améliore le
            résultat.
          </p>

          <input
            ref={inputRef}
            id="plant-image"
            type="file"
            accept="image/jpeg,image/png,image/webp"
            onChange={handleFileChange}
            style={{ display: "none" }}
            disabled={loading}
          />

          <label htmlFor="plant-image" style={styles.fileButton}>
            📷 Choisir une image
          </label>

          <p style={styles.fileHelp}>JPG, PNG, WEBP — maximum 10 Mo</p>

          {file && (
            <div style={styles.fileInfo}>
              <div>
                <strong>📎 {file.name}</strong>
                <p style={styles.fileSize}>
                  {(file.size / 1024 / 1024).toFixed(2)} Mo
                </p>
              </div>

              <button
                type="button"
                onClick={removeFile}
                disabled={loading}
                style={styles.removeButton}
              >
                Supprimer
              </button>
            </div>
          )}

          {previewUrl && (
            <div style={styles.previewBox}>
              <img
                src={previewUrl}
                alt="Aperçu de la plante sélectionnée"
                style={styles.previewImage}
              />
              <p style={styles.previewLabel}>Aperçu de la plante</p>
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
            <div style={styles.progressContainer}>
              <div style={styles.progressTop}>
                <span>Envoi et analyse de l’image…</span>
                <strong>{progress}%</strong>
              </div>

              <div style={styles.progressTrack}>
                <div
                  style={{
                    ...styles.progressBar,
                    width: `${progress}%`,
                  }}
                />
              </div>
            </div>
          )}

          {error && <div style={styles.errorBox}>⚠️ {error}</div>}

          {successMessage && (
            <div style={styles.successBox}>✓ {successMessage}</div>
          )}
        </div>

        <div style={styles.card}>
          <h2 style={styles.cardTitle}>Résultats de l’analyse</h2>

          {results.length === 0 && !loading && (
            <div style={styles.emptyState}>
              <div style={{ fontSize: 42 }}>🌱</div>
              <p>
                Les espèces reconnues apparaîtront ici après l’analyse de
                l’image.
              </p>
            </div>
          )}

          {loading && (
            <div style={styles.emptyState}>
              <div style={{ fontSize: 42 }}>🔎</div>
              <p>Recherche des espèces les plus probables…</p>
            </div>
          )}

          {results.length > 0 && (
            <div style={styles.resultsList}>
              {results.map((plant, index) => (
                <article key={plant.id || `${plant.species}-${index}`} style={styles.resultCard}>
                  <div style={styles.resultHeader}>
                    <span style={styles.rank}>#{index + 1}</span>
                    <span style={styles.confidence}>
                      {formatConfidence(plant.confidence)}
                    </span>
                  </div>

                  <h3 style={styles.plantName}>
                    {plant.name || "Plante inconnue"}
                  </h3>

                  <p style={styles.species}>
                    {plant.species || "Espèce inconnue"}
                  </p>

                  {(plant.family || plant.genus) && (
                    <div style={styles.taxonomy}>
                      {plant.family && <span>Famille : {plant.family}</span>}
                      {plant.genus && <span>Genre : {plant.genus}</span>}
                    </div>
                  )}
                </article>
              ))}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}

const styles = {
  page: {
    maxWidth: 1200,
    margin: "0 auto",
  },

  header: {
    marginBottom: 24,
  },

  eyebrow: {
    margin: 0,
    color: "#2e7d32",
    fontWeight: 700,
    fontSize: 12,
    letterSpacing: 1.2,
  },

  title: {
    margin: "8px 0",
    fontSize: 34,
    color: "#16351b",
  },

  subtitle: {
    margin: 0,
    color: "#526457",
    fontSize: 16,
    lineHeight: 1.5,
  },

  grid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))",
    gap: 20,
    alignItems: "start",
  },

  card: {
    background: "white",
    borderRadius: 18,
    padding: 24,
    boxShadow: "0 8px 30px rgba(23, 53, 27, 0.08)",
    border: "1px solid #e4eee5",
  },

  cardTitle: {
    margin: "0 0 8px",
    color: "#16351b",
    fontSize: 21,
  },

  cardText: {
    margin: "0 0 20px",
    color: "#617064",
    lineHeight: 1.5,
  },

  fileButton: {
    display: "inline-block",
    background: "#e7f5e8",
    color: "#1b5e20",
    padding: "12px 16px",
    borderRadius: 10,
    fontWeight: 700,
    cursor: "pointer",
  },

  fileHelp: {
    color: "#718074",
    fontSize: 13,
    margin: "10px 0 16px",
  },

  fileInfo: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 12,
    padding: 14,
    background: "#f6faf6",
    borderRadius: 12,
    marginBottom: 16,
    color: "#27452c",
  },

  fileSize: {
    margin: "5px 0 0",
    color: "#6d7c70",
    fontSize: 13,
  },

  removeButton: {
    border: "none",
    background: "transparent",
    color: "#b42318",
    fontWeight: 700,
    cursor: "pointer",
  },

  previewBox: {
    marginBottom: 18,
    overflow: "hidden",
    borderRadius: 14,
    border: "1px solid #e1e9e2",
    background: "#f7faf7",
  },

  previewImage: {
    display: "block",
    width: "100%",
    maxHeight: 300,
    objectFit: "cover",
  },

  previewLabel: {
    margin: 0,
    padding: "10px 12px",
    color: "#607064",
    fontSize: 13,
  },

  analyzeButton: {
    width: "100%",
    border: "none",
    borderRadius: 11,
    padding: "14px 18px",
    background: "#1b5e20",
    color: "white",
    fontWeight: 800,
    fontSize: 16,
    transition: "opacity 0.2s ease",
  },

  progressContainer: {
    marginTop: 18,
  },

  progressTop: {
    display: "flex",
    justifyContent: "space-between",
    gap: 12,
    color: "#49604d",
    fontSize: 14,
    marginBottom: 8,
  },

  progressTrack: {
    height: 10,
    background: "#e5eee6",
    borderRadius: 999,
    overflow: "hidden",
  },

  progressBar: {
    height: "100%",
    background: "#2e7d32",
    borderRadius: 999,
    transition: "width 0.2s ease",
  },

  errorBox: {
    marginTop: 16,
    padding: 13,
    borderRadius: 10,
    background: "#fff1f0",
    color: "#b42318",
    lineHeight: 1.45,
  },

  successBox: {
    marginTop: 16,
    padding: 13,
    borderRadius: 10,
    background: "#edf8ee",
    color: "#1b5e20",
    lineHeight: 1.45,
  },

  emptyState: {
    minHeight: 220,
    display: "grid",
    placeItems: "center",
    textAlign: "center",
    color: "#6a796d",
    padding: 20,
    border: "1px dashed #cbd9cd",
    borderRadius: 14,
    background: "#fbfdfb",
  },

  resultsList: {
    display: "grid",
    gap: 12,
  },

  resultCard: {
    padding: 16,
    borderRadius: 14,
    border: "1px solid #e1ebe2",
    background: "#fbfdfb",
  },

  resultHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 10,
  },

  rank: {
    color: "#2e7d32",
    fontWeight: 800,
  },

  confidence: {
    background: "#dff3e1",
    color: "#176b2a",
    padding: "5px 9px",
    borderRadius: 999,
    fontWeight: 800,
    fontSize: 13,
  },

  plantName: {
    margin: "0 0 5px",
    color: "#183b1e",
    fontSize: 18,
  },

  species: {
    margin: 0,
    color: "#536657",
    fontStyle: "italic",
  },

  taxonomy: {
    display: "flex",
    flexWrap: "wrap",
    gap: 8,
    marginTop: 12,
    color: "#627166",
    fontSize: 13,
  },
};