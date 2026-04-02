import {
  MapContainer,
  TileLayer,
  Popup,
  CircleMarker,
  GeoJSON,
} from "react-leaflet";
import { useState, useRef, useEffect } from "react";
import type { Feature, Point, LineString } from "geojson";
import L from "leaflet";
import { UserLocationMarker } from "./UserLocationMarker";
import type { EquipmentFilters } from "../types/equipmentFilters";
import { useGeolocation } from "../hooks/useGeolocation";

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

type Coordinates = {
  lat: number;
  lng: number;
};

interface MapProps {
  filters: EquipmentFilters;
  coordinates: Coordinates | null;
}

export const Map = ({ filters, coordinates }: MapProps) => {
  const { latitude, longitude } = useGeolocation();

  const [markers, setMarkers] = useState<EquipmentMarker[]>([]);
  const [hovered, setHovered] = useState<{
    feature: Feature<Point, EquipmentProperties>;
    latLng: L.LatLng;
  } | null>(null);

  const activeRef = useRef<L.CircleMarker | null>(null);
  const mapRef = useRef<L.Map | null>(null);

  const [route, setRoute] = useState<LineString>({
    type: "LineString",
    coordinates: [],
  });

  useEffect(() => {
    const fetchLocations = async () => {
      try {
        if (coordinates && latitude && longitude) {
          const res = await fetch(
            `${API_BASE}/route/?start_lat=${latitude}&start_lng=${longitude}&end_lat=${coordinates.lat}&end_lng=${coordinates.lng}`,
          );
          const data = await res.json();
          setRoute({
            type: "LineString",
            coordinates: [],
          });

          setTimeout(() => {
            setRoute(data);
          }, 0);

          console.log(data);

          if (mapRef.current) {
            mapRef.current.setView([coordinates.lat, coordinates.lng], 16);
          }
        }

        const token = localStorage.getItem("token");
        const headers: HeadersInit = token
          ? { Authorization: `Bearer ${token}` }
          : {};

        const params = new URLSearchParams();

        if (filters.committee.length > 0) {
          filters.committee.forEach((c) => params.append("committee", c));
        }

        if (filters.distance > 0 && latitude && longitude) {
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

        const res = await fetch(`${API_BASE}/locations/?${params.toString()}`, {
          headers,
        });

        if (!res.ok) {
          console.error("Failed to fetch locations");
          return;
        }

        const data: EquipmentMarker[] = await res.json();
        setMarkers(data);
      } catch (err) {
        console.error("Error fetching map data:", err);
      }
    };

    fetchLocations();
  }, [filters, latitude, longitude, coordinates]);

  return (
    <MapContainer
      center={[63.43, 10.4]}
      zoom={16}
      style={{ height: "100vh", width: "100%" }}
      zoomControl={false}
      className="absolute z-0"
    >
      <TileLayer
        attribution="© OpenStreetMap contributors © Stadia Maps"
        url="https://tiles.stadiamaps.com/tiles/alidade_smooth/{z}/{x}/{y}{r}.png"
      />

      {route.coordinates.length > 0 && (
        <GeoJSON key={JSON.stringify(route.coordinates)} data={route} />
      )}

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
                },
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

      {/* Hover popup */}
      {hovered && (
        <Popup position={hovered.latLng} closeButton={false}>
          {hovered.feature.properties?.name}
        </Popup>
      )}

      <UserLocationMarker />
    </MapContainer>
  );
};
