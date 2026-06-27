import { useCallback, useEffect, useMemo, useState } from "react";
import { MapContainer, Marker, Popup, TileLayer, useMap } from "react-leaflet";
import L from "leaflet";
import api from "../api";
import "leaflet/dist/leaflet.css";

/* =========================
   FIX LEAFLET ICONS
========================= */
delete L.Icon.Default.prototype._getIconUrl;

L.Icon.Default.mergeOptions({
  iconRetinaUrl:
    "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  iconUrl:
    "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  shadowUrl:
    "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
});

const selectedIcon = new L.Icon({
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
  iconSize: [30, 50],
  iconAnchor: [15, 50],
});

const API_URL = "http://localhost:3000";
const DEFAULT_CENTER = [48.8566, 2.3522];

/* =========================
   UTILITIES
========================= */
function formatDate(value) {
  if (!value) return "Date inconnue";
  return new Intl.DateTimeFormat("fr-FR", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

function getConfidenceLabel(value) {
  const c = Number(value || 0);
  if (c >= 80) return "Très fiable";
  if (c >= 55) return "Probable";
  return "À vérifier";
}

function isValidCoords(p) {
  const lat = Number(p.latitude);
  const lng = Number(p.longitude);
  return (
    Number.isFinite(lat) &&
    Number.isFinite(lng) &&
    lat !== 0 &&
    lng !== 0
  );
}

/* =========================
   FIX MAP RENDER (IMPORTANT VITE)
========================= */
function MapFix() {
  const map = useMap();

  useEffect(() => {
    const t = setTimeout(() => {
      map.invalidateSize();
    }, 300);

    return () => clearTimeout(t);
  }, [map]);

  return null;
}

/* =========================
   MAIN COMPONENT
========================= */
export default function Map() {
  const [plants, setPlants] = useState([]);
  const [search, setSearch] = useState("");
  const [selectedPlant, setSelectedPlant] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  /* LOAD */
  const loadPlants = useCallback(async () => {
    try {
      setLoading(true);
      setError("");

      const res = await api.get("/plants");
      const data = Array.isArray(res.data) ? res.data : [];

      setPlants(data);
      setSelectedPlant(data.find(isValidCoords) || null);
    } catch (e) {
      setError("Impossible de charger les plantes.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadPlants();
  }, [loadPlants]);

  /* FILTERS */
  const validPlants = useMemo(
    () => plants.filter(isValidCoords),
    [plants]
  );

  const filteredPlants = useMemo(() => {
    const s = search.toLowerCase().trim();
    if (!s) return validPlants;

    return validPlants.filter((p) =>
      (p.name || "").toLowerCase().includes(s) ||
      (p.species || "").toLowerCase().includes(s)
    );
  }, [validPlants, search]);

  /* CENTER */
  const center =
    selectedPlant && isValidCoords(selectedPlant)
      ? [Number(selectedPlant.latitude), Number(selectedPlant.longitude)]
      : filteredPlants.length
      ? [Number(filteredPlants[0].latitude), Number(filteredPlants[0].longitude)]
      : DEFAULT_CENTER;

  return (
    <section style={styles.page}>

      {/* HEADER */}
      <header style={styles.header}>
        <div>
          <p style={styles.eyebrow}>EXPLORATION BOTANIQUE</p>
          <h1 style={styles.title}>Carte des identifications</h1>
          <p style={styles.subtitle}>
            Visualisez vos plantes analysées avec IA
          </p>
        </div>

        <button onClick={loadPlants} style={styles.refreshButton}>
          ↻ Actualiser
        </button>
      </header>

      {/* STATS */}
      <div style={styles.statsGrid}>
        <div style={styles.statCard}>🌿 {plants.length} analyses</div>
        <div style={styles.statCard}>📍 {validPlants.length} localisées</div>
        <div style={styles.statCard}>
          🗺️{" "}
          {plants.length
            ? Math.round((validPlants.length / plants.length) * 100)
            : 0}
          %
        </div>
      </div>

      {error && <div style={styles.error}>{error}</div>}

      {loading ? (
        <div style={styles.empty}>Chargement...</div>
      ) : (
        <div style={styles.grid}>

          {/* SIDEBAR */}
          <aside style={styles.sidebar}>
            <h2>Plantes localisées</h2>

            <input
              placeholder="Rechercher..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={styles.input}
            />

            <div style={styles.list}>
              {filteredPlants.map((p) => (
                <button
                  key={p.id}
                  onClick={() => setSelectedPlant(p)}
                  style={styles.item}
                >
                  🌱 {p.name || "Plante"}
                </button>
              ))}
            </div>
          </aside>

          {/* MAP PANEL */}
          <div style={styles.mapPanel}>
            <div style={styles.mapHeader}>
              <h2>Carte interactive</h2>
              {selectedPlant && (
                <span>
                  📍 {Number(selectedPlant.latitude).toFixed(3)},
                  {Number(selectedPlant.longitude).toFixed(3)}
                </span>
              )}
            </div>

            {/* MAP FIXED */}
            <div style={{ height: 600, width: "100%" }}>
              <MapContainer
                center={center}
                zoom={selectedPlant ? 13 : 5}
                style={{ height: "100%", width: "100%" }}
              >
                <MapFix />

                <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />

               {filteredPlants.map((plant) => {
  const isSelected = selectedPlant?.id === plant.id;

  return (
    <Marker
      key={plant.id}
      position={[Number(plant.latitude), Number(plant.longitude)]}
      icon={isSelected ? selectedIcon : undefined}
      eventHandlers={{
        click: () => setSelectedPlant(plant),
      }}
    >
      <Popup>
        <strong>{plant.name || "Plante"}</strong>
        <br />
        {plant.species || "Espèce inconnue"}
        <br />
        📅 {formatDate(plant.createdAt)}
      </Popup>
    </Marker>
  );
})}
               
              </MapContainer>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}

/* =========================
   STYLES MINIMAL CLEAN
========================= */
const styles = {
  page: { padding: 20, background: "#0b1220", color: "white" },
  header: { display: "flex", justifyContent: "space-between" },
  eyebrow: { color: "#22c55e" },
  title: { fontSize: 28 },
  subtitle: { opacity: 0.7 },
  refreshButton: { background: "#22c55e", padding: 10, borderRadius: 10 },
  statsGrid: { display: "flex", gap: 10, margin: "20px 0" },
  statCard: { background: "#111827", padding: 10, borderRadius: 10 },
  error: { color: "red" },
  empty: { padding: 50 },
  grid: { display: "grid", gridTemplateColumns: "300px 1fr", gap: 20 },
  sidebar: { background: "#111827", padding: 15, borderRadius: 10 },
  input: { width: "100%", padding: 8 },
  list: { marginTop: 10 },
  item: { display: "block", width: "100%", textAlign: "left" },
  mapPanel: { background: "#111827", borderRadius: 10, overflow: "hidden" },
  mapHeader: {
    display: "flex",
    justifyContent: "space-between",
    padding: 10,
  },
};