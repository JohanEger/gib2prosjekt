import { MapContainer, TileLayer} from 'react-leaflet'


export const Map = () => {

    return (
    <MapContainer
      center={[60.39, 5.32]}
      zoom={16}
      style={{ height: "100vh", width: "100%" }}
    >
      <TileLayer
        attribution="© OpenStreetMap contributors"
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
    </MapContainer>
    )
}