import {
  MapContainer,
  TileLayer,
  Marker,
  GeoJSON,
} from "react-leaflet";
import MarkerClusterGroup from "react-leaflet-cluster";
import { useState, useRef, useEffect, use } from "react";
import type { Feature, Point, LineString } from "geojson";
import L from "leaflet";
import { UserLocationMarker } from "./UserLocationMarker";
import type { EquipmentFilters } from "../types/equipmentFilters";
import { useGeolocation } from "../hooks/useGeolocation";
import "leaflet.markercluster/dist/MarkerCluster.css";
import "leaflet.markercluster/dist/MarkerCluster.Default.css";

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

type MarkerWithProperties = L.Marker & {
  options: L.MarkerOptions & {
    equipmentData?: EquipmentMarker;
  };
};

interface MapProps {
  filters: EquipmentFilters;
  coordinates: Coordinates | null;
}

const createEquipmentIcon = (active: boolean = false) =>
  L.divIcon({
    className: "",
    html: `
      <div class="
        h-4 w-4 rounded-full border-2 border-black
        ${active ? "bg-blue-600" : "bg-zinc-400"}
      "></div>
    `,
    iconSize: [16, 16],
    iconAnchor: [8, 8],
  });

const createCustomClusterIcon = (cluster: any) => 
  L.divIcon({
    className: "marker-cluster marker-cluster-custom",
    html: `
      <div class="
        flex h-10 w-10 items-center justify-center
        rounded-full border-2 border-black
        bg-blue-600 text-sm font-bold text-white shadow-md
      ">
        ${cluster.getChildCount()}
      </div>
    `,
    iconSize: [40, 40],
    iconAnchor: [20, 20],
  });

export const Map = ({ filters, coordinates }: MapProps) => {
  const { latitude, longitude } = useGeolocation();

  const [markers, setMarkers] = useState<EquipmentMarker[]>([]);

  const [activeMarkerId, setActiveMarkerId] = useState<string | null>(null);
  const mapRef = useRef<L.Map | null>(null);
  
  const clusterKey = markers
    .map((m) => `${m.id}:${m.lat}:${m.lng}`)
    .join("|");

  const [route, setRoute] = useState<LineString>({
    type: "LineString",
    coordinates: [],
  });

  const clusterGroupRef = useRef<any>(null);

  useEffect(() => {
    clusterGroupRef.current?.refreshClusters();
  }, [markers, activeMarkerId]);

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

      <MarkerClusterGroup
        ref={clusterGroupRef}
        key={clusterKey}
        showCoverageOnHover={false}
        spiderfyOnMaxZoom={false}
        zoomToBoundsOnClick={false}
        removeOutsideVisibleBounds={true}
        iconCreateFunction={createCustomClusterIcon}
        eventHandlers={{
          clustermouseover: (e: any) => {
            const cluster = e.layer;
            const childMarkers = cluster.getAllChildMarkers() as MarkerWithProperties[];
            
            const items = childMarkers
              .map((m) => (m.options as L.MarkerOptions & { equipmentData?: EquipmentMarker }).equipmentData)
              .filter((data): data is EquipmentMarker => Boolean(data));
            
            if (items.length === 0) return;

            const html = `
              <div class="min-w-52">
                <ul class="space-y-1 text-sm">
                  ${items
                    .map(
                      (item) => `
                        <li class="rounded px-2 py-1">
                          ${item.name}
                        </li>
                      `,
                    )
                    .join("")}
                </ul>
              </div>
            `;

            cluster.bindTooltip(html, {
              direction: "top",
              offset: [0, -10],
              opacity: 1,
              sticky: false,
            });

            cluster.openTooltip();
          },

          clustermouseout: (e: any) => {
            const cluster = e.layer;
            cluster.closeTooltip();
            cluster.unbindTooltip();
          },
        }}
      >
      
      {markers.map((marker) => (
        <Marker
          key={`${marker.id}:${marker.lat}:${marker.lng}`}
          position={[marker.lat, marker.lng]}
          icon ={createEquipmentIcon(activeMarkerId === marker.id)}
          ref={(ref) => {
            if (ref) {
              (ref as MarkerWithProperties).options.equipmentData = marker;
            }
          }}
          eventHandlers={{
            // TODO: Add click handler to open a sidebar with more details about the equipment
            // click: () => {
            //   setActiveMarkerId((prev) => (prev === marker.id ? null : marker.id));
            // },
              
            mouseover: (e) => {
              const markerInstance = e.target as MarkerWithProperties;

              markerInstance.bindTooltip(
                `
                  <div class="min-w-32">
                    <div class="rounded px-2 py-1 text-sm">
                      ${marker.name}
                    </div>
                  </div>
                `,
                {
                  direction: "top",
                  offset: [0, -10],
                  opacity: 1,
                  sticky: false,
                },
              );

              markerInstance.openTooltip();
            },

            mouseout: (e) => {
              const markerInstance = e.target as MarkerWithProperties;
              markerInstance.closeTooltip();
              markerInstance.unbindTooltip();
            },
          }}
        />
      ))}
      </MarkerClusterGroup>
      <UserLocationMarker />
    </MapContainer>
  );
};
