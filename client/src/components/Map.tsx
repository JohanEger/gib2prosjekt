import { MapContainer, TileLayer, GeoJSON, Popup } from "react-leaflet";
import { useState } from "react";
import type { FeatureCollection, Point } from "geojson";
import L, { latLng, Layer, popup } from "leaflet";

export const Map = () => {
  const [data, setData] = useState<FeatureCollection<Point>>({
    type: "FeatureCollection",
    features: [
      {
        type: "Feature",
        properties: { name: "Soundboks" },
        geometry: {
          type: "Point",
          coordinates: [10.4, 63.43],
        },
      },
    ],
  });

  const [selected, setSelected] = useState<{
    feature: any;
    latLng: L.LatLng;
  } | null>(null);

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
      <GeoJSON
        data={data}
        pointToLayer={(feature, latLng) =>
          L.circleMarker(latLng, {
            radius: 8,
            fillColor: "#0b0070ff",
            fillOpacity: 1,
            color: "#000",
            weight: 2,
          })
        }
        onEachFeature={(feature, layer) => {
          layer.on({
            click: (e) => {
              console.log("clicked");
            },
            mouseover: (e) => {
              console.log("event latlng:", e.latlng);

              setSelected({
                feature,
                latLng: e.latlng,
              });
            },
            mouseout: (e) => {
              setSelected(null);
            },
          });
        }}
      ></GeoJSON>
      {selected && (
        <Popup position={selected.latLng} closeButton={false}>
          {selected.feature.properties.name}
        </Popup>
      )}
    </MapContainer>
  );
};
