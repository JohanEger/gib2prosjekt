import { MapContainer, TileLayer } from "react-leaflet";

export const Map = () => {
  return (
    <MapContainer
      center={[63.43, 10.4]}
      zoom={16}
      style={{ height: "100vh", width: "100%" }}
      zoomControl={false}
      className="absolute  z-0"
    >
      <TileLayer
        attribution="© OpenStreetMap contributors"
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
    </MapContainer>
  );
};
