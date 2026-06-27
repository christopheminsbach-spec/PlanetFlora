import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { MapContainer, TileLayer, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import "leaflet.markercluster";
import "leaflet.heat";
import api from "../api";

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

const DEFAULT_CENTER = [48.8566, 2.3522];

/* =========================
   UTIL
========================= */
function isValid(p) {
  const lat = Number(p.latitude);
  const lng = Number(p.longitude);
  return Number.isFinite(lat) && Number.isFinite(lng);
}

function formatDate(date) {
  if (!date) return "";
  return new Intl.DateTimeFormat("fr-FR", {
    dateStyle: "medium",
  }).format(new Date(date));
}

/* =========================
   MAP LAYERS CONTROL
========================= */
function MapController({
  plants,
  showHeat,
  timelineValue,
}) {
  const map = useMap();
  const clusterRef = useRef(null);
  const heatRef = useRef(null);

  useEffect(() => {
    if (!map) return;

    const L = window.L;

    /* CLEAN OLD LAYERS */
    if (clusterRef.current) {
      map.removeLayer(clusterRef.current);
    }
    if (heatRef.current) {
      map.removeLayer(heatRef.current);
    }

    const filtered = plants.filter(isValid);

    const visiblePlants = filtered.filter((p) => {
      if (!timelineValue) return true;
      return new Date(p.createdAt) <= new Date(timelineValue);
    });

    /* =========================
       CLUSTER
    ========================= */
    const cluster = L.markerClusterGroup();

    visiblePlants.forEach((p) => {
      const marker = L.marker([p.latitude, p.longitude]);

      marker.bindPopup(`
        <b>${p.name || "Plante"}</b><br/>
        ${p.species || ""}<br/>
        ${formatDate(p.createdAt)}
      `);

      cluster.addLayer(marker);
    });

    clusterRef.current = cluster;
    map.addLayer(cluster);

    /* =========================
       HEATMAP
    ========================= */
    if (showHeat) {
      const heatPoints = visiblePlants.map((p) => [
        p.latitude,
        p.longitude,
        0.6,
      ]);

      const heat = L.heatLayer(heatPoints, {
        radius: 25,
        blur: 18,
      });

      heatRef.current = heat;
      map.addLayer(heat);
    }

    return () => {
      if (clusterRef.current) map.removeLayer(clusterRef.current);
      if (heatRef.current) map.removeLayer(heatRef.current);
    };
  }, [map, plants, showHeat, timelineValue]);

  return null;
}

/* =========================
   MAIN MAP
========================= */
export default function Map() {
  const [plants, setPlants] = useState([]);
  const [search, setSearch] = useState("");
  const [speciesFilter, setSpeciesFilter] = useState("");
  const [selectedPlant, setSelectedPlant] = useState(null);

  const [showHeat, setShowHeat] = useState(false);
  const [satellite, setSatellite] = useState(false);

  const [timeline, setTimeline] = useState("");

  /* LOAD */
  const loadPlants = useCallback(async () => {
  try {
    const res = await api.get("/plants");

    console.log("API RESPONSE:", res.data);

    const data = Array.isArray(res.data) ? res.data : [];

    setPlants(data);
  } catch (err) {
    console.error("LOAD PLANTS ERROR:", err);
    alert("Erreur API /plants → regarde le backend");
  }
}, []);

  /* FILTERS */
  const filteredPlants = useMemo(() => {
    return plants.filter((p) => {
      if (!isValid(p)) return false;

      const matchSearch =
        p.name?.toLowerCase().includes(search.toLowerCase()) ||
        p.species?.toLowerCase().includes(search.toLowerCase());

      const matchSpecies =
        !speciesFilter ||
        p.species?.toLowerCase() === speciesFilter.toLowerCase();

      return matchSearch && matchSpecies;
    });
  }, [plants, search, speciesFilter]);

  const speciesList = useMemo(() => {
    return [...new Set(plants.map((p) => p.species).filter(Boolean))];
  }, [plants]);

  const center = selectedPlant
    ? [selectedPlant.latitude, selectedPlant.longitude]
    : DEFAULT_CENTER;

  /* =========================
     UI
  ========================= */
  return (
    <div style={styles.page}>
      <div style={styles.layout}>

        {/* ================= SIDEBAR ================= */}
        <div style={styles.sidebar}>

          <h2>🌿 Plantes</h2>

          <input
            placeholder="Rechercher..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={styles.input}
          />

          <select
            value={speciesFilter}
            onChange={(e) => setSpeciesFilter(e.target.value)}
            style={styles.input}
          >
            <option value="">Toutes les espèces</option>
            {speciesList.map((s, i) => (
              <option key={i} value={s}>
                {s}
              </option>
            ))}
          </select>

          {/* HISTORY */}
          <h3 style={{ marginTop: 15 }}>Historique</h3>

          <div style={styles.history}>
            {filteredPlants
              .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
              .map((p) => (
                <div
                  key={p.id}
                  onClick={() => setSelectedPlant(p)}
                  style={styles.historyItem}
                >
                  <b>{p.name}</b>
                  <div style={{ fontSize: 12, opacity: 0.6 }}>
                    {formatDate(p.createdAt)}
                  </div>
                </div>
              ))}
          </div>

          {/* CONTROLS */}
          <div style={styles.controls}>
            <label>
              <input
                type="checkbox"
                checked={showHeat}
                onChange={(e) => setShowHeat(e.target.checked)}
              />
              Heatmap
            </label>

            <label>
              <input
                type="checkbox"
                checked={satellite}
                onChange={(e) => setSatellite(e.target.checked)}
              />
              Satellite
            </label>
          </div>

          {/* TIMELINE */}
          <div>
            <h4>Timeline</h4>
            <input
              type="date"
              value={timeline}
              onChange={(e) => setTimeline(e.target.value)}
              style={styles.input}
            />
          </div>
        </div>

        {/* ================= MAP ================= */}
        <div style={styles.mapBox}>
          <MapContainer
            center={center}
            zoom={6}
            style={{ height: "100%", width: "100%" }}
          >
            <TileLayer
  url={
    satellite
      ? "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
      : "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
  }
/>

            <MapController
              plants={filteredPlants}
              showHeat={showHeat}
              timelineValue={timeline}
            />
          </MapContainer>
        </div>
      </div>
    </div>
  );
}

/* =========================
   STYLES
========================= */
const styles = {
  page: {
    height: "100vh",
    background: "#0b1220",
    color: "white",
  },
  layout: {
    display: "grid",
    gridTemplateColumns: "320px 1fr",
    height: "100%",
  },
  sidebar: {
    padding: 15,
    background: "#111827",
    overflowY: "auto",
  },
  mapBox: {
    height: "100%",
  },
  input: {
    width: "100%",
    padding: 8,
    marginBottom: 10,
    borderRadius: 6,
  },
  history: {
    maxHeight: 250,
    overflowY: "auto",
  },
  historyItem: {
    padding: 10,
    marginBottom: 6,
    background: "#1f2937",
    borderRadius: 8,
    cursor: "pointer",
  },
  controls: {
    marginTop: 15,
    display: "flex",
    flexDirection: "column",
    gap: 8,
  },
};