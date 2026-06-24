export default function PlantCard({ plant }) {
  if (!plant) return null;

  const name =
    plant.name ||
    plant.scientificName ||
    plant.species?.scientificName ||
    "Plante inconnue";

  const score = plant.score
    ? `${(plant.score * 100).toFixed(1)} %`
    : "Score indisponible";

  return (
    <article
      style={{
        border: "1px solid #d7e6d8",
        borderRadius: 12,
        padding: 16,
        marginTop: 12,
        background: "#fff"
      }}
    >
      <h3 style={{ marginTop: 0 }}>🌱 {name}</h3>
      <p style={{ marginBottom: 0 }}>
        Confiance : <strong>{score}</strong>
      </p>
    </article>
  );
}
