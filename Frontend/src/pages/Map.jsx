import { useCallback, useEffect, useMemo, useState } from "react";
import { MapContainer, Marker, Popup, TileLayer } from "react-leaflet";
import L from "leaflet";
import api from "../api";
import "leaflet/dist/leaflet.css";

// Corrige les icônes Leaflet avec Vite.
delete L.Icon.Default.prototype._getIconUrl;

L.Icon.Default.mergeOptions({
  iconRetinaUrl:
    "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  shadowUrl:
    "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
});

const API_URL = "http://localhost:3000";

// Position affichée si aucune plante n’a de coordonnées.
const DEFAULT_CENTER = [48.8566, 2.3522];

function formatDate(value) {
  if (!value) return "Date inconnue";

  return new Intl.DateTimeFormat("fr-FR", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

function getConfidenceLabel(value) {
  const confidence = Number(value || 0);

  if (confidence >= 80) return "Très fiable";
  if (confidence >= 55) return "Probable";
  return "À vérifier";
}

function hasValidCoordinates(plant) {
  const latitude = Number(plant.latitude);
  const longitude = Number(plant.longitude);

  return (
    Number.isFinite(latitude) &&
    Number.isFinite(longitude) &&
    latitude >= -90 &&
    latitude <= 90 &&
    longitude >= -180 &&
    longitude <= 180
  );
}

export default function Map() {
  const [plants, setPlants] = useState([]);
  const [search, setSearch] = useState("");
  const [selectedPlant, setSelectedPlant] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadPlants = useCallback(async () => {
    try {
      setLoading(true);
      setError("");

      const response = await api.get("/plants");
      const data = Array.isArray(response.data) ? response.data : [];

      setPlants(data);

      const firstPlantWithPosition = data.find(hasValidCoordinates);
      setSelectedPlant(firstPlantWithPosition || null);
    } catch (err) {
      setError(
        err.response?.data?.message ||
          "Impossible de charger les identifications pour la carte."
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadPlants();
  }, [loadPlants]);

  const plantsWithCoordinates = useMemo(
    () => plants.filter(hasValidCoordinates),
    [plants]
  );

  const filteredPlants = useMemo(() => {
    const normalizedSearch = search.trim().toLowerCase();

    if (!normalizedSearch) return plantsWithCoordinates;

    return plantsWithCoordinates.filter((plant) => {
      const name = String(plant.name || "").toLowerCase();
      const species = String(plant.species || "").toLowerCase();

      return (
        name.includes(normalizedSearch) ||
        species.includes(normalizedSearch)
      );
    });
  }, [plantsWithCoordinates, search]);

  const mapCenter = selectedPlant && hasValidCoordinates(selectedPlant)
    ? [Number(selectedPlant.latitude), Number(selectedPlant.longitude)]
    : filteredPlants.length > 0
      ? [Number(filteredPlants[0].latitude), Number(filteredPlants[0].longitude)]
      : DEFAULT_CENTER;

  function selectPlant(plant) {
    setSelectedPlant(plant);

    window.setTimeout(() => {
      document
        .getElementById("plant-map")
        ?.scrollIntoView({ behavior: "smooth", block: "center" });
    }, 50);
  }

  return (
    <section style={styles.page}>
      <header style={styles.header}>
        <div>
          <p style={styles.eyebrow}>EXPLORATION BOTANIQUE</p>
          <h1 style={styles.title}>Carte des identifications</h1>
          <p style={styles.subtitle}>
            Visualisez les plantes analysées avec leur position enregistrée.
          </p>
        </div>

        <button type="button" onClick={loadPlants} style={styles.refreshButton}>
          ↻ Actualiser
        </button>
      </header>

      <div style={styles.statsGrid}>
        <div style={styles.statCard}>
          <span style={styles.statIcon}>🌿</span>
          <div>
            <strong style={styles.statNumber}>{plants.length}</strong>
            <span style={styles.statLabel}>Analyses enregistrées</span>
          </div>
        </div>

        <div style={styles.statCard}>
          <span style={styles.statIcon}>📍</span>
          <div>
            <strong style={styles.statNumber}>
              {plantsWithCoordinates.length}
            </strong>
            <span style={styles.statLabel}>Positions disponibles</span>
          </div>
        </div>

        <div style={styles.statCard}>
          <span style={styles.statIcon}>🗺️</span>
          <div>
            <strong style={styles.statNumber}>
              {plantsWithCoordinates.length
                ? `${Math.round(
                    (plantsWithCoordinates.length / Math.max(plants.length, 1)) *
                      100
                  )}%`
                : "0%"}
            </strong>
            <span style={styles.statLabel}>Analyses géolocalisées</span>
          </div>
        </div>
      </div>

      {error && <div style={styles.error}>⚠️ {error}</div>}

      {loading ? (
        <div style={styles.emptyState}>
          <div style={styles.emptyIcon}>🗺️</div>
          <h2>Chargement de la carte…</h2>
          <p>Récupération des identifications enregistrées.</p>
        </div>
      ) : (
        <div style={styles.contentGrid}>
          <aside style={styles.sidebar}>
            <div style={styles.sidebarHeader}>
              <div>
                <h2 style={styles.sidebarTitle}>Plantes localisées</h2>
                <p style={styles.sidebarSubtitle}>
                  {filteredPlants.length} résultat
                  {filteredPlants.length > 1 ? "s" : ""}
                </p>
              </div>
            </div>

            <label style={styles.searchLabel} htmlFor="map-search">
              Rechercher une espèce
            </label>

            <input
              id="map-search"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Ex. Monstera, Rose…"
              style={styles.searchInput}
            />

            {plantsWithCoordinates.length === 0 ? (
              <div style={styles.noCoordinates}>
                <span style={styles.noCoordinatesIcon}>📍</span>
                <strong>Aucune position enregistrée</strong>
                <p>
                  Lors de l’analyse, autorisez la géolocalisation pour afficher
                  vos plantes ici.
                </p>
              </div>
            ) : filteredPlants.length === 0 ? (
              <div style={styles.noCoordinates}>
                <span style={styles.noCoordinatesIcon}>🔎</span>
                <strong>Aucun résultat</strong>
                <p>Essayez un autre nom de plante ou d’espèce.</p>
              </div>
            ) : (
              <div style={styles.plantList}>
                {filteredPlants.map((plant) => {
                  const imageUrl = plant.imageUrl
                    ? `${API_URL}${plant.imageUrl}`
                    : null;

                  const isSelected = selectedPlant?.id === plant.id;

                  return (
                    <button
                      type="button"
                      key={plant.id}
                      onClick={() => selectPlant(plant)}
                      style={{
                        ...styles.plantItem,
                        ...(isSelected ? styles.plantItemActive : {}),
                      }}
                    >
                      <div style={styles.thumbnail}>
                        {imageUrl ? (
                          <img
                            src={imageUrl}
                            alt={plant.name || plant.species || "Plante"}
                            style={styles.thumbnailImage}
                            onError={(event) => {
                              event.currentTarget.style.display = "none";
                              event.currentTarget.nextElementSibling.style.display =
                                "grid";
                            }}
                          />
                        ) : null}

                        <span
                          style={{
                            ...styles.thumbnailFallback,
                            display: imageUrl ? "none" : "grid",
                          }}
                        >
                          🌿
                        </span>
                      </div>

                      <span style={styles.plantItemText}>
                        <strong style={styles.plantItemName}>
                          {plant.name || "Nom inconnu"}
                        </strong>
                        <em style={styles.plantItemSpecies}>
                          {plant.species || "Espèce inconnue"}
                        </em>
                        <small style={styles.plantItemDate}>
                          {formatDate(plant.createdAt)}
                        </small>
                      </span>

                      <span style={styles.arrow}>›</span>
                    </button>
                  );
                })}
              </div>
            )}
          </aside>

          <div style={styles.mapPanel}>
            <div style={styles.mapHeader}>
              <div>
                <p style={styles.mapEyebrow}>CARTE INTERACTIVE</p>
                <h2 style={styles.mapTitle}>
                  {selectedPlant
                    ? selectedPlant.name || selectedPlant.species
                    : "Vos observations"}
                </h2>
              </div>

              {selectedPlant && (
                <span style={styles.coordinatesBadge}>
                  📍 {Number(selectedPlant.latitude).toFixed(4)},{" "}
                  {Number(selectedPlant.longitude).toFixed(4)}
                </span>
              )}
            </div>

            <div id="plant-map" style={styles.mapContainer}>
              <MapContainer
                key={`${mapCenter[0]}-${mapCenter[1]}`}
                center={mapCenter}
                zoom={selectedPlant ? 13 : 6}
                scrollWheelZoom
                style={styles.map}
              >
                <TileLayer
                  attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                  url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                />

                {filteredPlants.map((plant) => {
                  const imageUrl = plant.imageUrl
                    ? `${API_URL}${plant.imageUrl}`
                    : null;

                  return (
                    <Marker
                      key={plant.id}
                      position={[
                        Number(plant.latitude),
                        Number(plant.longitude),
                      ]}
                    >
                      <Popup>
                        <div style={{ minWidth: 190 }}>
                          {imageUrl && (
                            <img
                              src={imageUrl}
                              alt={plant.name || plant.species || "Plante"}
                              style={{
                                width: "100%",
                                height: 110,
                                objectFit: "cover",
                                borderRadius: 8,
                                marginBottom: 8,
                              }}
                            />
                          )}

                          <strong style={{ display: "block", fontSize: 15 }}>
                            {plant.name || "Nom inconnu"}
                          </strong>

                          <em
                            style={{
                              display: "block",
                              color: "#58705e",
                              marginTop: 3,
                            }}
                          >
                            {plant.species || "Espèce inconnue"}
                          </em>

                          <p style={{ margin: "8px 0 4px", fontSize: 12 }}>
                            Fiabilité :{" "}
                            <strong>{Number(plant.confidence || 0).toFixed(1)}%</strong>
                          </p>

                          <p style={{ margin: 0, fontSize: 12 }}>
                            {getConfidenceLabel(plant.confidence)}
                          </p>
                        </div>
                      </Popup>
                    </Marker>
                  );
                })}
              </MapContainer>
            </div>

            {selectedPlant && (
              <div style={styles.selectedDetails}>
                <div style={styles.selectedDetail}>
                  <span>🌱</span>
                  <div>
                    <small>Espèce identifiée</small>
                    <strong>{selectedPlant.species || "Espèce inconnue"}</strong>
                  </div>
                </div>

                <div style={styles.selectedDetail}>
                  <span>🎯</span>
                  <div>
                    <small>Niveau de confiance</small>
                    <strong>
                      {Number(selectedPlant.confidence || 0).toFixed(1)}% —{" "}
                      {getConfidenceLabel(selectedPlant.confidence)}
                    </strong>
                  </div>
                </div>

                <div style={styles.selectedDetail}>
                  <span>🕒</span>
                  <div>
                    <small>Date d’identification</small>
                    <strong>{formatDate(selectedPlant.createdAt)}</strong>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </section>
  );
}

const styles = {
  page: {
    width: "100%",
    maxWidth: 1500,
    margin: "0 auto",
    padding: "8px 0 40px",
    boxSizing: "border-box",
  },

  header: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 20,
    flexWrap: "wrap",
    marginBottom: 24,
  },

  eyebrow: {
    margin: 0,
    color: "#4f8a5b",
    fontSize: 12,
    fontWeight: 800,
    letterSpacing: 1.5,
  },

  title: {
    margin: "6px 0 8px",
    color: "#173d25",
    fontSize: "clamp(28px, 4vw, 42px)",
    lineHeight: 1.1,
  },

  subtitle: {
    margin: 0,
    color: "#607265",
    fontSize: 16,
    lineHeight: 1.5,
  },

  refreshButton: {
    border: "1px solid #cfe2d2",
    background: "#ffffff",
    color: "#246b37",
    borderRadius: 12,
    padding: "12px 16px",
    fontWeight: 800,
    cursor: "pointer",
    boxShadow: "0 4px 12px rgba(27, 94, 32, 0.08)",
  },

  statsGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
    gap: 16,
    marginBottom: 24,
  },

  statCard: {
    display: "flex",
    alignItems: "center",
    gap: 13,
    padding: 18,
    borderRadius: 18,
    background: "#ffffff",
    border: "1px solid #e4eee5",
    boxShadow: "0 8px 22px rgba(27, 78, 39, 0.06)",
  },

  statIcon: {
    display: "grid",
    placeItems: "center",
    width: 46,
    height: 46,
    borderRadius: 14,
    background: "#eaf7ec",
    fontSize: 23,
  },

  statNumber: {
    display: "block",
    color: "#1d5b2d",
    fontSize: 23,
    lineHeight: 1,
  },

  statLabel: {
    display: "block",
    marginTop: 5,
    color: "#6c7e70",
    fontSize: 12,
    fontWeight: 700,
  },

  error: {
    marginBottom: 22,
    padding: "14px 16px",
    borderRadius: 12,
    background: "#fff1f1",
    border: "1px solid #ffcaca",
    color: "#a52626",
    fontWeight: 600,
  },

  contentGrid: {
    display: "grid",
    gridTemplateColumns: "minmax(270px, 360px) minmax(0, 1fr)",
    gap: 22,
    alignItems: "start",
  },

  sidebar: {
    borderRadius: 20,
    background: "#ffffff",
    border: "1px solid #e3ece4",
    boxShadow: "0 12px 28px rgba(27, 78, 39, 0.08)",
    overflow: "hidden",
  },

  sidebarHeader: {
    padding: "20px 20px 10px",
  },

  sidebarTitle: {
    margin: 0,
    color: "#1c4928",
    fontSize: 19,
  },

  sidebarSubtitle: {
    margin: "5px 0 0",
    color: "#728277",
    fontSize: 13,
  },

  searchLabel: {
    display: "block",
    margin: "8px 20px 7px",
    color: "#55705b",
    fontSize: 12,
    fontWeight: 800,
  },

  searchInput: {
    width: "calc(100% - 40px)",
    margin: "0 20px 16px",
    padding: "11px 12px",
    boxSizing: "border-box",
    border: "1px solid #d8e6da",
    borderRadius: 11,
    outline: "none",
    fontSize: 14,
    background: "#fbfefb",
  },

  plantList: {
    maxHeight: 550,
    overflowY: "auto",
    borderTop: "1px solid #edf2ed",
  },

  plantItem: {
    width: "100%",
    display: "flex",
    alignItems: "center",
    gap: 11,
    padding: 14,
    boxSizing: "border-box",
    textAlign: "left",
    border: "none",
    borderBottom: "1px solid #edf2ed",
    background: "#ffffff",
    cursor: "pointer",
  },

  plantItemActive: {
    background: "#edf8ef",
  },

  thumbnail: {
    position: "relative",
    width: 48,
    height: 48,
    flex: "0 0 48px",
    overflow: "hidden",
    borderRadius: 12,
    background: "#e5f2e7",
  },

  thumbnailImage: {
    width: "100%",
    height: "100%",
    objectFit: "cover",
  },

  thumbnailFallback: {
    width: "100%",
    height: "100%",
    placeItems: "center",
    fontSize: 20,
  },

  plantItemText: {
    minWidth: 0,
    display: "flex",
    flexDirection: "column",
    gap: 2,
    flex: 1,
  },

  plantItemName: {
    overflow: "hidden",
    color: "#244d2e",
    fontSize: 14,
    textOverflow: "ellipsis",
    whiteSpace: "nowrap",
  },

  plantItemSpecies: {
    overflow: "hidden",
    color: "#6d7f71",
    fontSize: 12,
    textOverflow: "ellipsis",
    whiteSpace: "nowrap",
  },

  plantItemDate: {
    color: "#96a59a",
    fontSize: 10,
  },

  arrow: {
    color: "#4e8b5b",
    fontSize: 26,
    lineHeight: 1,
  },

  mapPanel: {
    overflow: "hidden",
    borderRadius: 20,
    background: "#ffffff",
    border: "1px solid #e3ece4",
    boxShadow: "0 12px 28px rgba(27, 78, 39, 0.08)",
  },

  mapHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 14,
    flexWrap: "wrap",
    padding: 20,
  },

  mapEyebrow: {
    margin: 0,
    color: "#4d8b59",
    fontSize: 11,
    fontWeight: 800,
    letterSpacing: 1.2,
  },

  mapTitle: {
    margin: "5px 0 0",
    color: "#1d4929",
    fontSize: 21,
  },

  coordinatesBadge: {
    padding: "8px 10px",
    borderRadius: 10,
    color: "#326b3d",
    background: "#edf8ef",
    fontSize: 12,
    fontWeight: 800,
  },

  mapContainer: {
    width: "100%",
    height: "clamp(360px, 60vh, 620px)",
    background: "#e9f2e9",
  },

  map: {
    width: "100%",
    height: "100%",
  },

  selectedDetails: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(190px, 1fr))",
    gap: 12,
    padding: 18,
    background: "#fbfefb",
    borderTop: "1px solid #e9f0e9",
  },

  selectedDetail: {
    display: "flex",
    alignItems: "center",
    gap: 10,
    padding: 12,
    borderRadius: 13,
    background: "#ffffff",
    border: "1px solid #e8f0e8",
  },

  emptyState: {
    minHeight: 320,
    display: "flex",
    flexDirection: "column",
    justifyContent: "center",
    alignItems: "center",
    textAlign: "center",
    padding: 30,
    borderRadius: 20,
    border: "1px dashed #b9d8be",
    background: "#fbfffb",
    color: "#58705e",
  },

  emptyIcon: {
    fontSize: 48,
    marginBottom: 8,
  },

  noCoordinates: {
    padding: "34px 22px",
    textAlign: "center",
    color: "#66796b",
  },

  noCoordinatesIcon: {
    display: "block",
    fontSize: 34,
    marginBottom: 10,
  },
};