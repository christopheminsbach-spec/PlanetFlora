import { useEffect, useMemo, useState } from "react";
import { Bar, Doughnut, Line } from "react-chartjs-2";
import {
  ArcElement,
  BarElement,
  CategoryScale,
  Chart as ChartJS,
  Filler,
  Legend,
  LineElement,
  LinearScale,
  PointElement,
  Tooltip,
} from "chart.js";
import api from "../api";

ChartJS.register(
  ArcElement,
  BarElement,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Filler,
  Tooltip,
  Legend
);

function normalizePlants(data) {
  if (Array.isArray(data)) return data;
  if (Array.isArray(data?.plants)) return data.plants;
  if (Array.isArray(data?.data)) return data.data;
  return [];
}

function getPlantDate(plant) {
  const rawDate =
    plant.createdAt ||
    plant.created_at ||
    plant.date ||
    plant.analyzedAt ||
    plant.analyzed_at;

  if (!rawDate) return null;

  const date = new Date(rawDate);
  return Number.isNaN(date.getTime()) ? null : date;
}

function formatDate(date) {
  return new Intl.DateTimeFormat("fr-FR", {
    day: "2-digit",
    month: "short",
  }).format(date);
}

function formatFullDate(date) {
  return new Intl.DateTimeFormat("fr-FR", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  }).format(date);
}

function getConfidence(plant) {
  const raw =
    plant.confidence ??
    plant.score ??
    plant.probability ??
    plant.accuracy ??
    0;

  const number = Number(raw);

  if (Number.isNaN(number)) return 0;

  return number <= 1 ? number * 100 : number;
}

function getSpeciesName(plant) {
  return (
    plant.species ||
    plant.scientificName ||
    plant.scientific_name ||
    plant.name ||
    "Espèce inconnue"
  );
}

export default function Analytics() {
  const [plants, setPlants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [lastUpdate, setLastUpdate] = useState(null);

  const loadAnalytics = async () => {
    setLoading(true);
    setError("");

    try {
      const response = await api.get("/plants");
      setPlants(normalizePlants(response.data));
      setLastUpdate(new Date());
    } catch (err) {
      console.error("Erreur Analytics :", err);

      setError(
        err.response?.data?.message ||
          "Impossible de charger les statistiques. Vérifie que le backend est démarré sur le port 3000."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAnalytics();
  }, []);

  const analytics = useMemo(() => {
    const total = plants.length;

    const speciesMap = plants.reduce((accumulator, plant) => {
      const species = getSpeciesName(plant);
      accumulator[species] = (accumulator[species] || 0) + 1;
      return accumulator;
    }, {});

    const sortedSpecies = Object.entries(speciesMap)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 6);

    const confidenceValues = plants
      .map(getConfidence)
      .filter((value) => value > 0);

    const averageConfidence =
      confidenceValues.length > 0
        ? Math.round(
            confidenceValues.reduce((sum, value) => sum + value, 0) /
              confidenceValues.length
          )
        : 0;

    const uniqueSpecies = Object.keys(speciesMap).length;

    const datedPlants = plants
      .map((plant) => ({
        ...plant,
        parsedDate: getPlantDate(plant),
      }))
      .filter((plant) => plant.parsedDate)
      .sort((a, b) => a.parsedDate - b.parsedDate);

    const dailyMap = datedPlants.reduce((accumulator, plant) => {
      const key = plant.parsedDate.toISOString().slice(0, 10);

      if (!accumulator[key]) {
        accumulator[key] = {
          label: formatDate(plant.parsedDate),
          fullDate: formatFullDate(plant.parsedDate),
          count: 0,
        };
      }

      accumulator[key].count += 1;
      return accumulator;
    }, {});

    const activity = Object.values(dailyMap).slice(-7);

    const latestPlant =
      datedPlants.length > 0 ? datedPlants[datedPlants.length - 1] : null;

    return {
      total,
      uniqueSpecies,
      averageConfidence,
      sortedSpecies,
      activity,
      latestPlant,
    };
  }, [plants]);

  const barData = {
    labels: analytics.sortedSpecies.map(([species]) => species),
    datasets: [
      {
        label: "Identifications",
        data: analytics.sortedSpecies.map(([, count]) => count),
        backgroundColor: "#2f855a",
        borderRadius: 10,
        borderSkipped: false,
      },
    ],
  };

  const doughnutData = {
    labels: analytics.sortedSpecies.map(([species]) => species),
    datasets: [
      {
        label: "Espèces",
        data: analytics.sortedSpecies.map(([, count]) => count),
        backgroundColor: [
          "#1f7a4c",
          "#3ca370",
          "#72bf8a",
          "#a7d9a9",
          "#d6edc9",
          "#eaf5e7",
        ],
        borderWidth: 0,
        hoverOffset: 8,
      },
    ],
  };

  const lineData = {
    labels: analytics.activity.map((item) => item.label),
    datasets: [
      {
        label: "Analyses réalisées",
        data: analytics.activity.map((item) => item.count),
        borderColor: "#1f7a4c",
        backgroundColor: "rgba(31, 122, 76, 0.12)",
        fill: true,
        tension: 0.35,
        pointRadius: 4,
        pointHoverRadius: 6,
      },
    ],
  };

  const commonChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        labels: {
          font: {
            family: "Arial",
          },
          color: "#3d5141",
        },
      },
      tooltip: {
        backgroundColor: "#173b26",
        padding: 12,
        titleFont: {
          family: "Arial",
        },
        bodyFont: {
          family: "Arial",
        },
      },
    },
  };

  const barOptions = {
    ...commonChartOptions,
    plugins: {
      ...commonChartOptions.plugins,
      legend: {
        display: false,
      },
    },
    scales: {
      x: {
        grid: {
          display: false,
        },
        ticks: {
          color: "#607064",
          maxRotation: 35,
          minRotation: 0,
        },
      },
      y: {
        beginAtZero: true,
        ticks: {
          precision: 0,
          color: "#607064",
        },
        grid: {
          color: "#edf2ed",
        },
      },
    },
  };

  const lineOptions = {
    ...commonChartOptions,
    plugins: {
      ...commonChartOptions.plugins,
      legend: {
        display: false,
      },
    },
    scales: {
      x: {
        grid: {
          display: false,
        },
        ticks: {
          color: "#607064",
        },
      },
      y: {
        beginAtZero: true,
        ticks: {
          precision: 0,
          color: "#607064",
        },
        grid: {
          color: "#edf2ed",
        },
      },
    },
  };

  return (
    <section style={styles.page}>
      <header style={styles.header}>
        <div>
          <p style={styles.eyebrow}>TABLEAU DE BORD</p>
          <h1 style={styles.title}>Statistiques de vos plantes</h1>
          <p style={styles.subtitle}>
            Suivez vos identifications, vos espèces reconnues et l’activité de
            votre jardin numérique.
          </p>
        </div>

        <button
          type="button"
          onClick={loadAnalytics}
          disabled={loading}
          style={{
            ...styles.refreshButton,
            opacity: loading ? 0.65 : 1,
            cursor: loading ? "not-allowed" : "pointer",
          }}
        >
          {loading ? "Chargement…" : "↻ Actualiser"}
        </button>
      </header>

      {error && (
        <div style={styles.errorBox}>
          <div>
            <strong>Impossible de charger les données</strong>
            <p style={{ margin: "5px 0 0" }}>{error}</p>
          </div>

          <button type="button" onClick={loadAnalytics} style={styles.retryButton}>
            Réessayer
          </button>
        </div>
      )}

      {loading ? (
        <div style={styles.loadingCard}>
          <div style={styles.loader} />
          <p>Chargement des statistiques…</p>
        </div>
      ) : (
        <>
          <div style={styles.statsGrid}>
            <article style={styles.statCard}>
              <div style={styles.statIcon}>🌿</div>
              <div>
                <p style={styles.statLabel}>Plantes analysées</p>
                <strong style={styles.statValue}>{analytics.total}</strong>
                <p style={styles.statHint}>Toutes vos identifications</p>
              </div>
            </article>

            <article style={styles.statCard}>
              <div style={styles.statIcon}>🧬</div>
              <div>
                <p style={styles.statLabel}>Espèces reconnues</p>
                <strong style={styles.statValue}>{analytics.uniqueSpecies}</strong>
                <p style={styles.statHint}>Diversité de votre collection</p>
              </div>
            </article>

            <article style={styles.statCard}>
              <div style={styles.statIcon}>🎯</div>
              <div>
                <p style={styles.statLabel}>Confiance moyenne</p>
                <strong style={styles.statValue}>
                  {analytics.averageConfidence}%
                </strong>
                <p style={styles.statHint}>Selon les résultats disponibles</p>
              </div>
            </article>

            <article style={styles.statCard}>
              <div style={styles.statIcon}>🕒</div>
              <div>
                <p style={styles.statLabel}>Dernière analyse</p>
                <strong style={styles.latestValue}>
                  {analytics.latestPlant?.parsedDate
                    ? formatDate(analytics.latestPlant.parsedDate)
                    : "Aucune"}
                </strong>
                <p style={styles.statHint}>
                  {analytics.latestPlant
                    ? getSpeciesName(analytics.latestPlant)
                    : "Importez une première photo"}
                </p>
              </div>
            </article>
          </div>

          {analytics.total === 0 ? (
            <div style={styles.emptyCard}>
              <div style={{ fontSize: 52 }}>🌱</div>
              <h2 style={{ color: "#1b4d2b", marginBottom: 8 }}>
                Aucune analyse pour le moment
              </h2>
              <p style={{ color: "#637566", margin: 0 }}>
                Ajoutez une photo depuis la page Upload pour voir apparaître
                vos graphiques et statistiques.
              </p>
            </div>
          ) : (
            <>
              <div style={styles.chartsGrid}>
                <article style={styles.chartCard}>
                  <div style={styles.chartHeader}>
                    <div>
                      <h2 style={styles.chartTitle}>Espèces les plus reconnues</h2>
                      <p style={styles.chartSubtitle}>
                        Top {analytics.sortedSpecies.length} des identifications
                      </p>
                    </div>
                    <span style={styles.chartBadge}>Répartition</span>
                  </div>

                  <div style={styles.chartHeight}>
                    <Bar data={barData} options={barOptions} />
                  </div>
                </article>

                <article style={styles.chartCard}>
                  <div style={styles.chartHeader}>
                    <div>
                      <h2 style={styles.chartTitle}>Diversité des espèces</h2>
                      <p style={styles.chartSubtitle}>
                        Distribution de votre collection
                      </p>
                    </div>
                    <span style={styles.chartBadge}>Espèces</span>
                  </div>

                  <div style={styles.chartHeight}>
                    <Doughnut
                      data={doughnutData}
                      options={{
                        ...commonChartOptions,
                        cutout: "65%",
                      }}
                    />
                  </div>
                </article>
              </div>

              <article style={styles.chartCard}>
                <div style={styles.chartHeader}>
                  <div>
                    <h2 style={styles.chartTitle}>Activité récente</h2>
                    <p style={styles.chartSubtitle}>
                      Nombre d’analyses enregistrées par jour
                    </p>
                  </div>
                  <span style={styles.chartBadge}>7 derniers jours</span>
                </div>

                <div style={styles.lineChartHeight}>
                  {analytics.activity.length > 0 ? (
                    <Line data={lineData} options={lineOptions} />
                  ) : (
                    <div style={styles.noDateData}>
                      Les dates ne sont pas encore disponibles dans les données
                      de l’API.
                    </div>
                  )}
                </div>
              </article>
            </>
          )}

          {lastUpdate && (
            <p style={styles.updateText}>
              Dernière mise à jour :{" "}
              {new Intl.DateTimeFormat("fr-FR", {
                hour: "2-digit",
                minute: "2-digit",
              }).format(lastUpdate)}
            </p>
          )}
        </>
      )}
    </section>
  );
}

const styles = {
  page: {
    maxWidth: 1280,
    margin: "0 auto",
    paddingBottom: 30,
  },

  header: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: 18,
    flexWrap: "wrap",
    marginBottom: 26,
  },

  eyebrow: {
    margin: 0,
    color: "#2f855a",
    fontWeight: 800,
    fontSize: 12,
    letterSpacing: 1.3,
  },

  title: {
    margin: "8px 0",
    color: "#163b23",
    fontSize: "clamp(28px, 4vw, 38px)",
    lineHeight: 1.1,
  },

  subtitle: {
    margin: 0,
    color: "#617164",
    lineHeight: 1.55,
    maxWidth: 680,
  },

  refreshButton: {
    border: "none",
    borderRadius: 10,
    padding: "12px 16px",
    background: "#1f7a4c",
    color: "white",
    fontWeight: 800,
    fontSize: 14,
  },

  statsGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
    gap: 16,
    marginBottom: 20,
  },

  statCard: {
    display: "flex",
    alignItems: "center",
    gap: 14,
    background: "white",
    border: "1px solid #e4eee6",
    borderRadius: 18,
    padding: 18,
    boxShadow: "0 8px 24px rgba(22, 59, 35, 0.06)",
  },

  statIcon: {
    width: 52,
    height: 52,
    display: "grid",
    placeItems: "center",
    borderRadius: 14,
    background: "#edf8ef",
    fontSize: 25,
    flexShrink: 0,
  },

  statLabel: {
    margin: 0,
    color: "#647467",
    fontSize: 13,
    fontWeight: 700,
  },

  statValue: {
    display: "block",
    marginTop: 3,
    color: "#173d25",
    fontSize: 30,
    lineHeight: 1.1,
  },

  latestValue: {
    display: "block",
    marginTop: 6,
    color: "#173d25",
    fontSize: 19,
    lineHeight: 1.2,
  },

  statHint: {
    margin: "5px 0 0",
    color: "#819084",
    fontSize: 12,
    whiteSpace: "nowrap",
    overflow: "hidden",
    textOverflow: "ellipsis",
    maxWidth: 170,
  },

  chartsGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))",
    gap: 20,
    marginBottom: 20,
  },

  chartCard: {
    background: "white",
    border: "1px solid #e4eee6",
    borderRadius: 18,
    padding: 20,
    boxShadow: "0 8px 24px rgba(22, 59, 35, 0.06)",
  },

  chartHeader: {
    display: "flex",
    justifyContent: "space-between",
    gap: 12,
    alignItems: "flex-start",
    marginBottom: 16,
  },

  chartTitle: {
    margin: 0,
    color: "#173d25",
    fontSize: 18,
  },

  chartSubtitle: {
    margin: "5px 0 0",
    color: "#758477",
    fontSize: 13,
  },

  chartBadge: {
    color: "#287044",
    background: "#eaf6ec",
    borderRadius: 999,
    padding: "6px 9px",
    fontSize: 11,
    fontWeight: 800,
    whiteSpace: "nowrap",
  },

  chartHeight: {
    height: 290,
  },

  lineChartHeight: {
    height: 280,
  },

  emptyCard: {
    background: "white",
    border: "1px dashed #bdd3c1",
    borderRadius: 18,
    padding: 44,
    textAlign: "center",
    boxShadow: "0 8px 24px rgba(22, 59, 35, 0.04)",
  },

  loadingCard: {
    minHeight: 320,
    display: "grid",
    placeItems: "center",
    alignContent: "center",
    gap: 14,
    background: "white",
    borderRadius: 18,
    border: "1px solid #e4eee6",
    color: "#52705b",
  },

  loader: {
    width: 38,
    height: 38,
    border: "4px solid #dceee0",
    borderTopColor: "#1f7a4c",
    borderRadius: "50%",
    animation: "spin 0.9s linear infinite",
  },

  errorBox: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 16,
    flexWrap: "wrap",
    marginBottom: 20,
    padding: 16,
    borderRadius: 14,
    background: "#fff3f1",
    border: "1px solid #ffd5cf",
    color: "#a72b1e",
  },

  retryButton: {
    border: "none",
    borderRadius: 9,
    padding: "10px 13px",
    background: "#b73a2d",
    color: "white",
    fontWeight: 800,
    cursor: "pointer",
  },

  noDateData: {
    height: "100%",
    display: "grid",
    placeItems: "center",
    textAlign: "center",
    color: "#748276",
    background: "#fbfdfb",
    borderRadius: 12,
    border: "1px dashed #d3dfd5",
    padding: 20,
  },

  updateText: {
    margin: "18px 0 0",
    textAlign: "right",
    color: "#839086",
    fontSize: 12,
  },
};