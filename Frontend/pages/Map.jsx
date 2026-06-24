import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import "leaflet/dist/leaflet.css";

export default function Map() {
  const plants = [
    { id: 1, name: "Monstera", lat: 47.2184, lng: -1.5536 },
    { id: 2, name: "Ficus", lat: 48.8566, lng: 2.3522 }
  ];

  return (
    <div>
      <h1>🗺️ Map des plantes</h1>

      <MapContainer center={[46.8, 2.2]} zoom={5} style={{ height: 500 }}>
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        {plants.map(p => (
          <Marker key={p.id} position={[p.lat, p.lng]}>
            <Popup>{p.name}</Popup>
          </Marker>
        ))}
      </MapContainer>
    </div>
  );
}