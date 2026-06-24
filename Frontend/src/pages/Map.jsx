import { MapContainer, TileLayer, Marker } from "react-leaflet";

export default function MapView() {
  return (
    <MapContainer center={[48.85, 2.35]} zoom={5} style={{ height: 500 }}>
      <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
      <Marker position={[48.85, 2.35]} />
    </MapContainer>
  );
}