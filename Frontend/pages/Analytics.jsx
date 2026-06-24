import { useEffect, useMemo, useState } from "react";
import {
  Bar,
  Doughnut,
  Line,
} from "react-chartjs-2";
import {
  ArcElement,
  BarElement,
  CategoryScale,
  Chart as ChartJS,
  Legend,
  LineElement,
  LinearScale,
  PointElement,
  Tooltip,
} from "chart.js";

ChartJS.register(
  ArcElement,
  BarElement,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Tooltip,
  Legend
);

const API_URL = "http://localhost:3000";

function normalizePlants(data) {
  if (Array.isArray(data)) return data;
  if (Array.isArray(data?.plants)) return data.plants;
  if (Array.isArray(data?.results)) return data.results;
  return [];
}

function getDateKey(plant) {
  const value =
    plant.createdAt ||
    plant.created_at ||
    plant.date ||
    plant.updatedAt ||
    new Date().toISOString();

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return new Date().toISOString().slice(0, 10);
  }

  return date.toISOString().slice(0, 10);
}

export default function Analytics({ apiUrl = API_URL }) {
  const [plants, setPlants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const controller = new AbortController();

    async function loadPlants() {
      try {
        setLoading(true);
        setError("");

        const response = await fetch(`${apiUrl}/plants`, {
          signal: controller.signal,
        });

        if (!response.ok) {
          throw new Error(`Erreur API : ${response.status}`);
        }

        const data = await response.json();
        setPlants(normalizePlants(data));
      } catch (err) {
        if (err.name !== "AbortError") {
          setError(err.message || "Impossible de charger les statistiques.");
        }
      } finally {
        setLoading(false);
      }
    }

    loadPlants();

    return () => controller.abort();
  }, [apiUrl]);

  const statistics = useMemo(() => {
    const speciesMap = {};
    const dateMap = {};
    let confidenceTotal = 0;
    let confidenceCount = 0;

    plants.forEach((plant) => {
      const species = plant.species || plant.name || "Inconnue";
      speciesMap[species] = (speciesMap[species] || 0) + 1;

      const date = getDateKey(plant);
      dateMap[date] = (dateMap[date] || 0) + 1;

      const confidence = Number(plant.confidence);
      if (!Number.isNaN(confidence) && confidence > 0) {
        confidenceTotal += confidence;
        confidenceCount += 1;
      }
    });

    const speciesEntries = Object.entries(speciesMap).sort(
      (a, b) => b[1] - a[1]
    );

    const dateEntries = Object.entries(dateMap)
      .sort((a, b) => new Date(a[0]) - new Date(b[0]))
      .slice(-7);

    return {
      total: plants.length,
      uniqueSpecies: speciesEntries.length,
      averageConfidence:
        confidenceCount > 0
          ? Math.round((confidenceTotal / confidenceCount) * 100)
          : 0,
      speciesEntries,
      dateEntries,
    };
  }, [plants]);

  const speciesLabels = statistics.speciesEntries.map(([name]) => name);
  const speciesValues = statistics.speciesEntries.map(([, count]) => count);

  const datesLabels = statistics.dateEntries.map(([date]) =>
    new Date(date).toLocaleDateString("fr-FR", {
      day: "2-digit",
      month: "2-digit",
    })
  );

  const datesValues = statistics.dateEntries.map(([, count]) => count);

  const barData = {
    labels: speciesLabels.length ? speciesLabels : ["Aucune donnée"],
    datasets: [
      {
        label: "Nombre de plantes",
        data: speciesValues.length ? speciesValues : [0],
        backgroundColor: "#2e7d32",
        borderRadius: 8,
      },
    ],
  };

  const doughnutData = {
    labels: speciesLabels.length ? speciesLabels : ["Aucune donnée"],
    datasets: [
      {
        label: "Répartition",
        data: speciesValues.length ? speciesValues : [1],
        backgroundColor: [
          "#2e7d32",
          "#66bb6a",
          "#a5d6a7",
          "#1565c0",
          "#42a5f5",
          "#ffb300",
          "#8e24aa",
        ],
        borderWidth: 0,
      },
    ],
  };

  const lineData = {
    labels: datesLabels.length ? datesLabels : ["Aujourd’hui"],
    datasets: [
      {
        label: "Identifications",
        data: datesValues.length ? datesValues : [0],
        borderColor: "#1b5e20",
        backgroundColor: "rgba(46, 125, 50, 0.15)",
        tension: 0.35,
        fill: true,
      },
    ],
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: "bottom",
      },
    },
  };

  if (loading) {
    return <p>Chargement des statistiques...</p>;
  }

  return (
    <section>
      <div style={styles.header}>
        <div>
          <p style={styles.eyebrow}>PLANET FLORA</p>
          <h1 style={styles.title}>📊 Statistiques</h1>
          <p style={styles.subtitle}>
            Vue d’ensemble des plantes identifiées.
          </p>
        </div>

        <button
          type="button"
          onClick={() => window.location.reload()}
          style={styles.refreshButton}
        >
          Actualiser
        </button>
      </div>

      {error && (
        <div style={styles.error}>
          <strong>API indisponible :</strong> {error}
          <br />
          Vérifie que le backend tourne sur <code>http://localhost:3000</code>.
        </div>
      )}

      <div style={styles.cards}>
        <StatCard icon="🌿" label="Plantes identifiées" value={statistics.total} />
        <StatCard icon="🧬" label="Espèces différentes" value={statistics.uniqueSpecies} />
        <StatCard
          icon="🎯"
          label="Confiance moyenne"
          value={`${statistics.averageConfidence}%`}
        />
      </div>

      <div style={styles.grid}>
        <article style={styles.chartCard}>
          <h2 style={styles.chartTitle}>Plantes par espèce</h2>
          <div style={styles.chartHeight}>
            <Bar data={barData} options={chartOptions} />
          </div>
        </article>

        <article style={styles.chartCard}>
          <h2 style={styles.chartTitle}>Répartition des espèces</h2>
          <div style={styles.chartHeight}>
            <Doughnut data={doughnutData} options={chartOptions} />
          </div>
        </article>

        <article style={{ ...styles.chartCard, gridColumn: "1 / -1" }}>
          <h2 style={styles.chartTitle}>Identifications récentes</h2>
          <div style={styles.chartHeight}>
            <Line data={lineData} options={chartOptions} />
          </div>
        </article>
      </div>

      <article style={styles.tableCard}>
        <h2 style={styles.chartTitle}>Détail des espèces</h2>

        {statistics.speciesEntries.length === 0 ? (
          <p>Aucune plante n’a encore été enregistrée.</p>
        ) : (
          <table style={styles.table}>
            <thead>
              <tr>
                <th style={styles.th}>Espèce</th>
                <th style={styles.th}>Nombre</th>
              </tr>
            </thead>
            <tbody>
              {statistics.speciesEntries.map(([species, count]) => (
                <tr key={species}>
                  <td style={styles.td}>{species}</td>
                  <td style={styles.td}>{count}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </article>
    </section>
  );
}

function StatCard({ icon, label, value }) {
  return (
    <article style={styles.statCard}>
      <div style={styles.statIcon}>{icon}</div>
      <div>
        <p style={styles.statLabel}>{label}</p>
        <strong style={styles.statValue}>{value}</strong>
      </div>
    </article>
  );
}

const styles = {
  header: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: 20,
    marginBottom: 24,
  },
  eyebrow: {
    color: "#2e7d32",
    fontWeight: 700,
    letterSpacing: 1,
    fontSize: 12,
    margin: "0 0 6px",
  },
  title: {
    margin: 0,
    fontSize: 32,
    color: "#173d1b",
  },
  subtitle: {
    margin: "8px 0 0",
    color: "#607064",
  },
  refreshButton: {
    border: 0,
    borderRadius: 8,
    padding: "10px 14px",
    background: "#1b5e20",
    color: "white",
    cursor: "pointer",
  },
  error: {
    background: "#ffebee",
    color: "#b71c1c",
    border: "1px solid #ffcdd2",
    borderRadius: 10,
    padding: 14,
    marginBottom: 20,
  },
  cards: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(190px, 1fr))",
    gap: 16,
    marginBottom: 20,
  },
  statCard: {
    background: "white",
    borderRadius: 14,
    padding: 18,
    display: "flex",
    gap: 14,
    alignItems: "center",
    boxShadow: "0 2px 10px rgba(27, 94, 32, 0.08)",
  },
  statIcon: {
    fontSize: 30,
    background: "#e8f5e9",
    borderRadius: 12,
    padding: 10,
  },
  statLabel: {
    margin: 0,
    color: "#68756b",
    fontSize: 14,
  },
  statValue: {
    display: "block",
    marginTop: 5,
    color: "#173d1b",
    fontSize: 28,
  },
  grid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))",
    gap: 20,
    marginBottom: 20,
  },
  chartCard: {
    background: "white",
    borderRadius: 14,
    padding: 20,
    boxShadow: "0 2px 10px rgba(27, 94, 32, 0.08)",
  },
  chartTitle: {
    marginTop: 0,
    color: "#173d1b",
    fontSize: 18,
  },
  chartHeight: {
    height: 280,
  },
  tableCard: {
    background: "white",
    borderRadius: 14,
    padding: 20,
    boxShadow: "0 2px 10px rgba(27, 94, 32, 0.08)",
  },
  table: {
    width: "100%",
    borderCollapse: "collapse",
  },
  th: {
    textAlign: "left",
    padding: 12,
    borderBottom: "2px solid #e8f0e8",
    color: "#3e5141",
  },
  td: {
    padding: 12,
    borderBottom: "1px solid #edf2ed",
  },
};