import { useEffect, useState } from "react";

export default function Analytics({ apiUrl = "http://localhost:3000" }) {
  const [plants, setPlants] = useState([]);
  const [error, setError] = useState("");

  useEffect(() => {
    fetch(`${apiUrl}/plants`)
      .then((response) => {
        if (!response.ok) {
          throw new Error("Impossible de charger les statistiques.");
        }
        return response.json();
      })
      .then((data) => {
        setPlants(Array.isArray(data) ? data : []);
      })
      .catch((err) => {
        setError(err.message);
      });
  }, [apiUrl]);

  const total = plants.length;

  const speciesCount = plants.reduce((acc, plant) => {
    const species = plant.species || "Espèce inconnue";
    acc[species] = (acc[species] || 0) + 1;
    return acc;
  }, {});

  return (
    <section>
      <h1>📊 Analytics</h1>

      {error && (
        <p style={{ color: "#b91c1c" }}>
          {error}
        </p>
      )}

      <div
        style={{
          background: "white",
          padding: 20,
          borderRadius: 12,
          marginBottom: 20,
          boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
        }}
      >
        <h2>{total}</h2>
        <p>Plantes enregistrées</p>
      </div>

      <div
        style={{
          background: "white",
          padding: 20,
          borderRadius: 12,
          boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
        }}
      >
        <h2>Répartition par espèce</h2>

        {Object.keys(speciesCount).length === 0 ? (
          <p>Aucune donnée disponible.</p>
        ) : (
          <ul>
            {Object.entries(speciesCount).map(([species, count]) => (
              <li key={species}>
                {species} : {count}
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  );
}