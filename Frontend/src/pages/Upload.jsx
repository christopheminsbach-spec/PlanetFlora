import { useState } from "react";
import api from "../api";

function percent(value) {
  return `${Math.round(Number(value || 0) * 100)}%`;
}

export default function Upload() {
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState("");
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [results, setResults] = useState([]);
  const [analysis, setAnalysis] = useState(null);
  const [error, setError] = useState("");

  function handleFileChange(event) {
    const selectedFile = event.target.files?.[0];

    setFile(selectedFile || null);
    setResults([]);
    setAnalysis(null);
    setError("");
    setProgress(0);

    if (selectedFile) {
      setPreview(URL.createObjectURL(selectedFile));
    } else {
      setPreview("");
    }
  }

  async function analyzePlant() {
    if (!file) {
      setError("Choisis une image avant de lancer l'analyse.");
      return;
    }

    const formData = new FormData();
    formData.append("image", file);

    try {
      setLoading(true);
      setError("");
      setResults([]);
      setAnalysis(null);
      setProgress(0);

      const response = await api.post("/plants/identify", formData, {
        onUploadProgress: (event) => {
          if (event.total) {
            setProgress(Math.round((event.loaded * 100) / event.total));
          }
        },
      });

      setResults(
        Array.isArray(response.data.results) ? response.data.results : []
      );

      setAnalysis({
        imageName: response.data.imageName,
        analyzedAt: response.data.analyzedAt,
      });

      setProgress(100);
    } catch (err) {
      console.error(err);

      setError(
        err.response?.data?.message ||
          "Impossible d'analyser l'image. Vérifie que le backend fonctionne sur le port 3000."
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <section style={{ maxWidth: 950 }}>
      <h1>🌿 Identifier une plante</h1>
      <p>
        Importe une photo. Pl@ntNet proposera les espèces les plus probables,
        avec leur famille, genre et niveau de confiance.
      </p>

      <div
        style={{
          background: "white",
          padding: 20,
          borderRadius: 14,
          boxShadow: "0 2px 10px rgba(0,0,0,0.08)",
        }}
      >
        <input
          type="file"
          accept="image/jpeg,image/png,image/webp"
          onChange={handleFileChange}
          disabled={loading}
        />

        {preview && (
          <div style={{ marginTop: 18 }}>
            <p style={{ marginBottom: 8 }}>Aperçu de la plante</p>
            <img
              src={preview}
              alt="Aperçu de la plante sélectionnée"
              style={{
                width: "100%",
                maxWidth: 500,
                maxHeight: 360,
                objectFit: "cover",
                borderRadius: 12,
                border: "1px solid #d1d5db",
              }}
            />
          </div>
        )}

        <button
          type="button"
          onClick={analyzePlant}
          disabled={!file || loading}
          style={{
            marginTop: 18,
            padding: "11px 16px",
            border: 0,
            borderRadius: 8,
            cursor: !file || loading ? "not-allowed" : "pointer",
            background: "#1b5e20",
            color: "white",
            fontWeight: 700,
          }}
        >
          {loading ? "Analyse détaillée en cours..." : "Analyser la plante"}
        </button>

        {loading && (
          <div style={{ marginTop: 16, maxWidth: 500 }}>
            <div
              style={{
                height: 10,
                borderRadius: 99,
                background: "#e5e7eb",
                overflow: "hidden",
              }}
            >
              <div
                style={{
                  width: `${progress}%`,
                  height: "100%",
                  background: "#1b5e20",
                  transition: "width 0.2s ease",
                }}
              />
            </div>
            <p>{progress}% de l’image envoyé</p>
          </div>
        )}

        {error && (
          <p style={{ color: "#b91c1c", marginTop: 16 }}>
            {error}
          </p>
        )}
      </div>

      {analysis && (
        <p style={{ marginTop: 18, color: "#4b5563" }}>
          Image analysée : <strong>{analysis.imageName}</strong>
          {analysis.analyzedAt &&
            ` — ${new Date(analysis.analyzedAt).toLocaleString("fr-FR")}`}
        </p>
      )}

      {results.length > 0 && (
        <section style={{ marginTop: 24 }}>
          <h2>Résultats les plus probables</h2>

          <div style={{ display: "grid", gap: 14 }}>
            {results.map((plant) => (
              <article
                key={plant.id}
                style={{
                  background: "white",
                  border: "1px solid #e5e7eb",
                  borderRadius: 14,
                  padding: 18,
                  boxShadow: "0 2px 8px rgba(0,0,0,0.06)",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    gap: 16,
                    alignItems: "start",
                  }}
                >
                  <div>
                    <p style={{ margin: 0, color: "#1b5e20", fontWeight: 700 }}>
                      Proposition #{plant.rank}
                    </p>
                    <h3 style={{ margin: "6px 0" }}>
                      {plant.name}
                    </h3>
                    <p style={{ margin: 0, fontStyle: "italic" }}>
                      {plant.scientificName || plant.species}
                    </p>
                  </div>

                  <strong
                    style={{
                      background: "#dcfce7",
                      color: "#166534",
                      padding: "8px 10px",
                      borderRadius: 999,
                      whiteSpace: "nowrap",
                    }}
                  >
                    {percent(plant.confidence)}
                  </strong>
                </div>

                <hr style={{ border: 0, borderTop: "1px solid #e5e7eb", margin: "16px 0" }} />

                <p><strong>Famille :</strong> {plant.family}</p>
                <p><strong>Genre :</strong> {plant.genus}</p>

                {plant.commonNames?.length > 0 && (
                  <p>
                    <strong>Noms communs :</strong>{" "}
                    {plant.commonNames.join(", ")}
                  </p>
                )}

                <div
                  style={{
                    height: 10,
                    borderRadius: 99,
                    background: "#e5e7eb",
                    overflow: "hidden",
                    marginTop: 12,
                  }}
                >
                  <div
                    style={{
                      width: percent(plant.confidence),
                      height: "100%",
                      background: "#1b5e20",
                    }}
                  />
                </div>
              </article>
            ))}
          </div>
        </section>
      )}
    </section>
  );
}