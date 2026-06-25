import { useEffect, useMemo, useState } from "react";
import api from "../api";

export default function Dashboard() {
  const [plants, setPlants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;

    async function loadPlants() {
      try {
        setLoading(true);
        setError("");

        const response = await api.get("/plants");

        if (active) {
          setPlants(Array.isArray(response.data) ? response.data : []);
        }
      } catch (err) {
        if (active) {
          setError(
            err.response?.data?.message ||
              "Impossible de charger les plantes. Vérifie que le backend fonctionne sur le port 3000."
          );
        }
      } finally {
        if (active) setLoading(false);
      }
    }

    loadPlants();

    return () => {
      active = false;
    };
  }, []);

  const stats = useMemo(() => {
    const species = new Set(
      plants
        .map((plant) => plant.species)
        .filter(Boolean)
    );

    const recentPlants = [...plants].slice(0, 4);

    return {
      total: plants.length,
      species: species.size,
      recentPlants,
    };
  }, [plants]);

  return (
    <section style={styles.page}>
      <div style={styles.hero}>
        <div style={styles.heroText}>
          <p style={styles.badge}>🌿 PLANET FLORA</p>

          <h1 style={styles.title}>
            Bienvenue dans votre espace végétal.
          </h1>

          <p style={styles.subtitle}>
            Identifiez vos plantes, consultez votre historique et suivez votre
            collection depuis un seul tableau de bord.
          </p>

          <div style={styles.actions}>
            <a href="/upload" style={styles.primaryButton}>
              📷 Identifier une plante
            </a>

            <a href="/history" style={styles.secondaryButton}>
              Voir l’historique
            </a>
          </div>
        </div>

        <div style={styles.heroPlant}>
          <div style={styles.plantCircle}>🌱</div>
          <p style={styles.heroPlantText}>Votre jardin numérique</p>
        </div>
      </div>

      <div style={styles.statsGrid}>
        <article style={styles.statCard}>
          <div style={styles.statIcon}>🪴</div>
          <div>
            <p style={styles.statLabel}>Plantes enregistrées</p>
            <h2 style={styles.statNumber}>{loading ? "…" : stats.total}</h2>
          </div>
        </article>

        <article style={styles.statCard}>
          <div style={styles.statIcon}>🌿</div>
          <div>
            <p style={styles.statLabel}>Espèces différentes</p>
            <h2 style={styles.statNumber}>{loading ? "…" : stats.species}</h2>
          </div>
        </article>

        <article style={styles.statCard}>
          <div style={styles.statIcon}>📸</div>
          <div>
            <p style={styles.statLabel}>Action rapide</p>
            <h2 style={{ ...styles.statNumber, fontSize: 18 }}>
              Nouvelle analyse
            </h2>
          </div>
        </article>
      </div>

      <div style={styles.contentGrid}>
        <article style={styles.panel}>
          <div style={styles.panelHeader}>
            <div>
              <p style={styles.panelEyebrow}>COLLECTION</p>
              <h2 style={styles.panelTitle}>Dernières plantes</h2>
            </div>

            <a href="/history" style={styles.link}>
              Tout voir →
            </a>
          </div>

          {loading && <p style={styles.mutedText}>Chargement des plantes…</p>}

          {!loading && error && (
            <div style={styles.errorBox}>
              <strong>Connexion API indisponible</strong>
              <p style={{ margin: "6px 0 0" }}>{error}</p>
            </div>
          )}

          {!loading && !error && stats.recentPlants.length === 0 && (
            <div style={styles.emptyBox}>
              <div style={{ fontSize: 44 }}>🌱</div>
              <h3>Aucune plante enregistrée</h3>
              <p>
                Commence par importer une photo pour identifier ta première
                plante.
              </p>
              <a href="/upload" style={styles.primaryButton}>
                Ajouter une plante
              </a>
            </div>
          )}

          {!loading && !error && stats.recentPlants.length > 0 && (
            <div style={styles.plantList}>
              {stats.recentPlants.map((plant, index) => (
                <div key={plant.id || index} style={styles.plantRow}>
                  <div style={styles.plantAvatar}>🌿</div>

                  <div style={{ flex: 1 }}>
                    <h3 style={styles.plantName}>
                      {plant.name || "Plante inconnue"}
                    </h3>
                    <p style={styles.plantSpecies}>
                      {plant.species || "Espèce non renseignée"}
                    </p>
                  </div>

                  <span style={styles.status}>Identifiée</span>
                </div>
              ))}
            </div>
          )}
        </article>

        <aside style={styles.tipsPanel}>
          <p style={styles.panelEyebrow}>CONSEIL DU JOUR</p>

          <h2 style={styles.tipTitle}>
            Une photo nette améliore l’identification.
          </h2>

          <p style={styles.tipText}>
            Photographiez la feuille, la fleur ou la plante entière avec une
            bonne lumière naturelle pour obtenir une analyse plus précise.
          </p>

          <a href="/upload" style={styles.tipButton}>
            Importer une image →
          </a>
        </aside>
      </div>
    </section>
  );
}

const styles = {
  page: {
    width: "100%",
    maxWidth: 1300,
    margin: "0 auto",
    boxSizing: "border-box",
  },

  hero: {
    minHeight: 280,
    padding: "42px",
    borderRadius: 24,
    color: "white",
    background:
      "linear-gradient(135deg, #14532d 0%, #166534 50%, #2f855a 100%)",
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 30,
    boxSizing: "border-box",
    boxShadow: "0 18px 45px rgba(20, 83, 45, 0.22)",
  },

  heroText: {
    maxWidth: 680,
  },

  badge: {
    display: "inline-block",
    margin: 0,
    padding: "7px 12px",
    borderRadius: 999,
    fontSize: 12,
    fontWeight: 800,
    letterSpacing: 1,
    background: "rgba(255,255,255,0.16)",
  },

  title: {
    margin: "18px 0 12px",
    fontSize: "clamp(30px, 5vw, 52px)",
    lineHeight: 1.05,
  },

  subtitle: {
    margin: 0,
    maxWidth: 620,
    fontSize: 17,
    lineHeight: 1.65,
    color: "rgba(255,255,255,0.86)",
  },

  actions: {
    display: "flex",
    flexWrap: "wrap",
    gap: 12,
    marginTop: 26,
  },

  primaryButton: {
    display: "inline-block",
    padding: "12px 18px",
    borderRadius: 10,
    background: "#ffffff",
    color: "#166534",
    textDecoration: "none",
    fontWeight: 800,
    boxShadow: "0 8px 20px rgba(0,0,0,0.15)",
  },

  secondaryButton: {
    display: "inline-block",
    padding: "12px 18px",
    borderRadius: 10,
    border: "1px solid rgba(255,255,255,0.45)",
    color: "white",
    textDecoration: "none",
    fontWeight: 700,
  },

  heroPlant: {
    minWidth: 180,
    textAlign: "center",
  },

  plantCircle: {
    width: 125,
    height: 125,
    margin: "0 auto 12px",
    display: "grid",
    placeItems: "center",
    borderRadius: "50%",
    fontSize: 62,
    background: "rgba(255,255,255,0.14)",
    border: "1px solid rgba(255,255,255,0.20)",
  },

  heroPlantText: {
    margin: 0,
    fontWeight: 700,
    color: "rgba(255,255,255,0.85)",
  },

  statsGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
    gap: 18,
    marginTop: 24,
  },

  statCard: {
    display: "flex",
    alignItems: "center",
    gap: 15,
    padding: 22,
    borderRadius: 18,
    background: "white",
    boxShadow: "0 6px 20px rgba(20, 40, 25, 0.08)",
  },

  statIcon: {
    width: 52,
    height: 52,
    display: "grid",
    placeItems: "center",
    borderRadius: 15,
    fontSize: 27,
    background: "#dcfce7",
  },

  statLabel: {
    margin: 0,
    color: "#64748b",
    fontSize: 14,
  },

  statNumber: {
    margin: "5px 0 0",
    color: "#14532d",
    fontSize: 30,
  },

  contentGrid: {
    display: "grid",
    gridTemplateColumns: "minmax(0, 2fr) minmax(280px, 1fr)",
    gap: 22,
    marginTop: 24,
    alignItems: "start",
  },

  panel: {
    padding: 26,
    borderRadius: 20,
    background: "white",
    boxShadow: "0 6px 20px rgba(20, 40, 25, 0.08)",
  },

  panelHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 15,
    marginBottom: 20,
  },

  panelEyebrow: {
    margin: 0,
    color: "#16a34a",
    fontSize: 12,
    fontWeight: 800,
    letterSpacing: 1,
  },

  panelTitle: {
    margin: "6px 0 0",
    color: "#163020",
    fontSize: 25,
  },

  link: {
    color: "#15803d",
    textDecoration: "none",
    fontWeight: 800,
    whiteSpace: "nowrap",
  },

  plantList: {
    display: "grid",
    gap: 12,
  },

  plantRow: {
    display: "flex",
    alignItems: "center",
    gap: 14,
    padding: 14,
    borderRadius: 14,
    background: "#f8faf8",
    border: "1px solid #e8f0e8",
  },

  plantAvatar: {
    width: 46,
    height: 46,
    display: "grid",
    placeItems: "center",
    borderRadius: 13,
    background: "#dcfce7",
    fontSize: 24,
  },

  plantName: {
    margin: 0,
    color: "#1f2937",
    fontSize: 16,
  },

  plantSpecies: {
    margin: "4px 0 0",
    color: "#64748b",
    fontSize: 14,
    fontStyle: "italic",
  },

  status: {
    padding: "6px 10px",
    borderRadius: 999,
    background: "#dcfce7",
    color: "#166534",
    fontSize: 12,
    fontWeight: 800,
  },

  tipsPanel: {
    padding: 26,
    borderRadius: 20,
    color: "white",
    background: "linear-gradient(150deg, #0f766e, #166534)",
    boxShadow: "0 8px 24px rgba(20, 83, 45, 0.18)",
  },

  tipTitle: {
    margin: "12px 0",
    fontSize: 27,
    lineHeight: 1.15,
  },

  tipText: {
    margin: 0,
    color: "rgba(255,255,255,0.85)",
    lineHeight: 1.6,
  },

  tipButton: {
    display: "inline-block",
    marginTop: 24,
    padding: "11px 14px",
    borderRadius: 10,
    color: "#14532d",
    background: "white",
    textDecoration: "none",
    fontWeight: 800,
  },

  mutedText: {
    color: "#64748b",
  },

  errorBox: {
    padding: 16,
    borderRadius: 12,
    color: "#991b1b",
    background: "#fef2f2",
    border: "1px solid #fecaca",
  },

  emptyBox: {
    padding: "34px 20px",
    textAlign: "center",
    color: "#64748b",
    borderRadius: 14,
    background: "#f8faf8",
  },
};