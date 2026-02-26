import { MapContainer, TileLayer} from 'react-leaflet'


export const Map = () => {

    return (
     <MapContainer
      center={[63.43, 10.40]}
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