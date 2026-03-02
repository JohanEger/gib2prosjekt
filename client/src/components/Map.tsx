import { MapContainer, TileLayer, GeoJSON, Popup } from "react-leaflet";
import { useState, useRef, act } from "react";
import type { FeatureCollection, Point } from "geojson";
import L, { latLng, Layer, marker, popup } from "leaflet";

export const Map = () => {
  const [data, setData] = useState<FeatureCollection<Point>>({
    type: "FeatureCollection",
    features: [
      {
        type: "Feature",
        id: "1",
        properties: { name: "Soundboks 1" },
        geometry: {
          type: "Point",
          coordinates: [10.4, 63.43],
        },
      },
      {
        type: "Feature",
        id: "2",
        properties: { name: "Soundboks 2" },
        geometry: {
          type: "Point",
          coordinates: [10.3969, 63.4269],
        },
      },
      {
        type: "Feature",
        id: "3",
        properties: { name: "Soundboks 3" },
        geometry: {
          type: "Point",
          coordinates: [10.3927, 63.4225],
        },
      },
    ],
  });

  const [hovered, setHovered] = useState<{
    feature: any;
    latLng: L.LatLng;
  } | null>(null);

  const activeRef = useRef<L.CircleMarker | null>(null);

  return (
    <MapContainer
      center={[63.43, 10.4]}
      zoom={16}
      style={{ height: "100vh", width: "100%" }}
      zoomControl={false}
      className="absolute  z-0"
    >
      <TileLayer
        attribution="© OpenStreetMap contributors © Stadia Maps"
        url="https://tiles.stadiamaps.com/tiles/alidade_smooth/{z}/{x}/{y}{r}.png"
      />
      <GeoJSON
        data={data}
        pointToLayer={(feature, latLng) =>
          L.circleMarker(latLng, {
            radius: 8,
            fillColor: "#acacacff",
            fillOpacity: 1,
            color: "#000",
            weight: 2,
          })
        }
        onEachFeature={(feature, layer) => {
          layer.on({
            click: (e) => {
              const target = e.target as L.CircleMarker;

              if (activeRef.current === target) {
                target.setStyle({ fillColor: "#acacacff" });
                activeRef.current = null;
                return;
              }

              if (activeRef.current) {
                activeRef.current.setStyle({ fillColor: "#acacacff" });
              }

              target.setStyle({ fillColor: "#0400ffff" });
              activeRef.current = target;
            },

            mouseover: (e) => {
              const target = e.target as L.CircleMarker;

              if (activeRef.current !== target) {
                target.setStyle({
                  fillColor: "#0400ffff",
                });
              }

              setHovered({
                feature,
                latLng: e.latlng,
              });
            },

            mouseout: (e) => {
              const target = e.target as L.CircleMarker;

              target.setStyle({
                fillColor:
                  activeRef.current === target ? "#0400ffff" : "#acacacff",
              });

              setHovered(null);
            },
          });
        }}
      ></GeoJSON>
      {hovered && (
        <Popup position={hovered.latLng} closeButton={false}>
          {hovered.feature.properties.name}
        </Popup>
      )}
    </MapContainer>
  );
};
