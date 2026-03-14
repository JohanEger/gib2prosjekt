import { MapContainer, TileLayer, GeoJSON, Popup } from "react-leaflet";
import { useState, useRef, useEffect, useMemo } from "react";
import type { Feature, FeatureCollection, Point } from "geojson";
import L from "leaflet";
import { UserLocationMarker } from "./UserLocationMarker";

const API_BASE = import.meta.env.VITE_BACKEND_BASE_URL ?? "http://localhost:5001";

type EquipmentMarker = {
  id: string;
  name: string;
  lat: number;
  lng: number;
}

type EquipmentProperties = {
  id: string
  name: string;
}

export const Map = () => {
  const [markers,setMarkers] = useState<EquipmentMarker[]>([]);
  const [hovered, setHovered] = useState<{
    feature: Feature<Point, EquipmentProperties>;
    latLng: L.LatLng;
  } | null>(null);

  const activeRef = useRef<L.CircleMarker | null>(null);

  useEffect(() => {
    const fetchLocations = async () => {
      const response = await fetch(`${API_BASE}/locations/`);  // Riktig endpoint?
      if (!response.ok) {
        console.error("Failed to fetch locations");
        return;
      }
      const data: EquipmentMarker[] = await response.json();
      setMarkers(data);
    };

    fetchLocations().catch((error) => {
      console.error("Error fetching locations:", error);
    });
  }, []);

  const data: FeatureCollection<Point, EquipmentProperties> = useMemo(() => ({
    type: "FeatureCollection",
    features: markers.map((marker) => ({
      type: "Feature",
      properties: {
        id: marker.id,
        name: marker.name,
      },
      geometry: {
        type: "Point",
        coordinates: [marker.lng, marker.lat],
      },
    })),
  }), [markers]);


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
        pointToLayer={(_feature, latLng) =>
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
                feature: feature as Feature<Point, EquipmentProperties>,
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
          {hovered.feature.properties?.name}
        </Popup>
      )}
      <UserLocationMarker />
    </MapContainer>
  );
};
