import { MapContainer, TileLayer, Popup, CircleMarker } from "react-leaflet";
import { useState, useRef, useEffect, useMemo } from "react";
import type { Feature, FeatureCollection, Point, LineString } from "geojson";
import L from "leaflet";
import { UserLocationMarker } from "./UserLocationMarker";
import type { EquipmentFilters } from "../types/equipmentFilters";
import { useGeolocation } from "../hooks/useGeolocation";
import { GeoJSON } from "react-leaflet";
import type { GeoJsonObject } from "geojson";

const API_BASE =
  import.meta.env.VITE_BACKEND_BASE_URL ?? "http://localhost:5001";

type EquipmentMarker = {
  id: string;
  name: string;
  lat: number;
  lng: number;
};

type EquipmentProperties = {
  id: string;
  name: string;
};

interface MapProps {
  filters: EquipmentFilters;
}

export const Map = ({ filters }: MapProps) => {
  const [markers, setMarkers] = useState<EquipmentMarker[]>([]);
  const [hovered, setHovered] = useState<{
    feature: Feature<Point, EquipmentProperties>;
    latLng: L.LatLng;
  } | null>(null);
  const { latitude, longitude } = useGeolocation();

  const activeRef = useRef<L.CircleMarker | null>(null);

  const [route, setRoute] = useState<LineString>({
    type: "LineString",
    coordinates: [],
  });
  useEffect(() => {
    const fetchLocations = async () => {
      const route = fetch(
        `http://localhost:5001/route/?start_lat=${latitude}&start_lng=${longitude}&end_lat=63.418120&end_lng=10.403334`,
      )
        .then((res) => res.json())
        .then((data) => {
          console.log("Route:", data.coordinates);
          setRoute(data);
        });

      const token = localStorage.getItem("token");
      const headers: HeadersInit = token
        ? { Authorization: `Bearer ${token}` }
        : {};

      const params = new URLSearchParams();

      if (filters.committee.length > 0) {
        for (const committee of filters.committee) {
          params.append("committee", committee);
        }
      }
      if (filters.distance > 0 && latitude !== null && longitude !== null) {
        params.append("euclidean_distance", filters.distance.toString());
        params.append("latitude", latitude.toString());
        params.append("longitude", longitude.toString());
      }
      if (filters.typeOfEquipment) {
        params.append("type_of_equipment", filters.typeOfEquipment);
      }
      if (filters.available) {
        params.append("available", "true");
      }

      console.log("token from localStorage:", localStorage.getItem("token"));
      console.log(
        "request url:",
        `${API_BASE}/locations/?${params.toString()}`,
      );
      console.log("headers being sent:", headers);

      const response = await fetch(
        `${API_BASE}/locations/?${params.toString()}`,
        {
          headers,
        },
      );

      if (!response.ok) {
        const text = await response.text();
        console.error("Failed to fetch locations:", response.status, text);
        return;
      }
      const data: EquipmentMarker[] = await response.json();
      console.log("locations from backend:", data);
      setMarkers(data);
    };

    fetchLocations().catch((error) => {
      console.error("Error fetching locations:", error);
    });
  }, [filters, latitude, longitude]);

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
      <GeoJSON data={route}></GeoJSON>
      {markers.map((marker) => (
        <CircleMarker
          key={marker.id}
          center={[marker.lat, marker.lng]}
          radius={8}
          pathOptions={{
            fillColor: "#acacacff",
            fillOpacity: 1,
            color: "#000",
            weight: 2,
          }}
          eventHandlers={{
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
                target.setStyle({ fillColor: "#0400ffff" });
              }

              setHovered({
                feature: {
                  type: "Feature",
                  properties: {
                    id: marker.id,
                    name: marker.name,
                  },
                  geometry: {
                    type: "Point",
                    coordinates: [marker.lng, marker.lat],
                  },
                } as Feature<Point, EquipmentProperties>,
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
          }}
        />
      ))}
      {hovered && (
        <Popup position={hovered.latLng} closeButton={false}>
          {hovered.feature.properties?.name}
        </Popup>
      )}
      <UserLocationMarker />
    </MapContainer>
  );
};
