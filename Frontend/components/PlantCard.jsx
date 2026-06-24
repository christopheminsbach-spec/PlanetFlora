export default function PlantCard({ plant }) {
  return (
    <div style={{
      border: "1px solid #ddd",
      padding: 10,
      margin: 10,
      borderRadius: 10
    }}>
      <h3>{plant.species}</h3>
      <p>Confidence: {plant.confidence}</p>
      {plant.image && <img src={plant.image} width="100" />}
    </div>
  );
}