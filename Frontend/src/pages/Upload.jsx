import { useState } from "react";
import api from "../api";
import Loader from "../components/Loader";
import PlantCard from "../components/PlantCard";

export default function Upload() {
  const [image, setImage] = useState(null);
  const [preview, setPreview] = useState("");
  const [plants, setPlants] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  function handleFileChange(event) {
    const file = event.target.files?.[0];

    setError("");
    setPlants([]);

    if (!file) {
      setImage(null);
      setPreview("");
      return;
    }

    if (!file.type.startsWith("image/")) {
      setError("Choisis une image JPG, PNG ou WEBP.");
      setImage(null);
      setPreview("");
      return;
    }

    setImage(file);
    setPreview(URL.createObjectURL(file));
  }

  async function handleSubmit(event) {
    event.preventDefault();

    if (!image) {
      setError("Sélectionne une photo de plante avant de lancer l'analyse.");
      return;
    }

    setLoading(true);
    setError("");
    setPlants([]);

    try {
      const formData = new FormData();
      formData.append("image", image);

      const response = await api.post("/predict", formData, {
        headers: {
          "Content-Type": "multipart/form-data"
        }
      });

      const results =
        response.data.top5 ||
        response.data.results ||
        response.data.predictions ||
        [];

      setPlants(Array.isArray(results) ? results : []);
    } catch (err) {
      console.error(err);

      setError(
        err.response?.data?.message ||
        err.response?.data?.error ||
        "Impossible d'analyser cette image. Vérifie que le backend est démarré."
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{ maxWidth: 760 }}>
      <h1>Identifier une plante</h1>
      <p>Importe une photo : l’API Pl@ntNet proposera les espèces les plus probables.</p>

      <form onSubmit={handleSubmit}>
        <input
          type="file"
          accept="image/*"
          onChange={handleFileChange}
          style={{ margin: "16px 0" }}
        />

        {preview && (
          <img
            src={preview}
            alt="Aperçu de la plante"
            style={{
              display: "block",
              width: "100%",
              maxWidth: 420,
              maxHeight: 320,
              objectFit: "cover",
              borderRadius: 12,
              marginBottom: 16
            }}
          />
        )}

        <button
          type="submit"
          disabled={loading}
          style={{
            padding: "10px 16px",
            border: 0,
            borderRadius: 8,
            cursor: loading ? "wait" : "pointer",
            background: "#2e7d32",
            color: "white"
          }}
        >
          {loading ? "Analyse en cours..." : "Analyser la plante"}
        </button>
      </form>

      {loading && <Loader />}

      {error && (
        <p style={{ color: "#b71c1c", marginTop: 16 }}>
          {error}
        </p>
      )}

      {plants.length > 0 && (
        <section style={{ marginTop: 24 }}>
          <h2>Résultats</h2>

          {plants.map((plant, index) => (
            <PlantCard
              key={plant.name || plant.scientificName || index}
              plant={plant}
            />
          ))}
        </section>
      )}
    </div>
  );
}
