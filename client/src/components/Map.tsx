import {
  MapContainer,
  TileLayer,
  Marker,
  GeoJSON,
  Tooltip,
} from "react-leaflet";
import MarkerClusterGroup from "react-leaflet-cluster";
import {
  useState,
  useRef,
  useEffect,
  startTransition,
  type Dispatch,
  type SetStateAction,
} from "react";
import type { LineString } from "geojson";
import L from "leaflet";
import { UserLocationMarker } from "./UserLocationMarker";
import {
  ROUTE_LINE_STYLE,
  type RouteTravelMode,
} from "../types/routeTravelMode";
import type { RoutePanelState } from "../types/routePanelState";
import type { EquipmentFilters } from "../types/equipmentFilters";
import { useGeolocation } from "../hooks/useGeolocation";
import "leaflet.markercluster/dist/MarkerCluster.css";
import "leaflet.markercluster/dist/MarkerCluster.Default.css";
import type { LogPosition } from "../types/logPositions";
import { LogMapLayer } from "./LogMapLayer";

const API_BASE =
  import.meta.env.VITE_BACKEND_BASE_URL ?? "http://localhost:5001";

// --- Typer -------------------------------------------------------------------

type EquipmentMarker = {
  id: string;
  name: string;
  lat: number;
  lng: number;
};

type Coordinates = {
  lat: number;
  lng: number;
};

type RouteResponse = LineString & {
  meters?: number;
  seconds?: number;
};

interface MapProps {
  filters: EquipmentFilters;
  coordinates: Coordinates | null;
  travelMode: RouteTravelMode;
  onRoutePanelChange: Dispatch<SetStateAction<RoutePanelState>>;
  selectedEquipmentId: string | null;
  logPositions: { lat: number; lng: number; start_time: string }[];
  LogPositions: LogPosition[];
  showLogMode: boolean;
  setShowLogMode: React.Dispatch<React.SetStateAction<boolean>>;
}

interface MarkerClusterLike extends L.Layer {
  getChildCount(): number;
  getAllChildMarkers(): L.Marker[];
  bindTooltip(content: string, options?: L.TooltipOptions): this;
  openTooltip(): this;
  closeTooltip(): this;
  unbindTooltip(): this;
}

// --- Statiske konstanter -----------------------------------------------------

const TRONDHEIM_CENTER: [number, number] = [63.43, 10.4];

const emptyLineString = (): LineString => ({
  type: "LineString",
  coordinates: [],
});

const makeEquipmentIcon = (active: boolean) =>
  L.divIcon({
    className: "",
    html: `<div class="h-4 w-4 rounded-full border-2 border-black ${
      active ? "bg-green-700" : "bg-blue-600"
    }"></div>`,
    iconSize: [16, 16],
    iconAnchor: [8, 8],
  });

const ICON_IDLE = makeEquipmentIcon(false);
const ICON_ACTIVE = makeEquipmentIcon(true);

const createClusterIcon = (cluster: MarkerClusterLike) =>
  L.divIcon({
    className: "marker-cluster marker-cluster-custom",
    html: `<div class="flex h-10 w-10 items-center justify-center rounded-full border-2 border-black bg-blue-600 text-sm font-bold text-white shadow-md">${cluster.getChildCount()}</div>`,
    iconSize: L.point(40, 40, true),
  });

function isValidRoutePayload(data: unknown): data is RouteResponse {
  if (!data || typeof data !== "object") return false;
  const d = data as Record<string, unknown>;
  if (d.type !== "LineString") return false;
  if (!Array.isArray(d.coordinates)) return false;
  return d.coordinates.every(
    (c) =>
      Array.isArray(c) &&
      c.length >= 2 &&
      typeof c[0] === "number" &&
      typeof c[1] === "number",
  );
}

// --- Komponent ---------------------------------------------------------------

export const Map = ({
  filters,
  coordinates,
  travelMode,
  onRoutePanelChange,
  selectedEquipmentId,
  LogPositions,
}: MapProps) => {
  const { latitude, longitude } = useGeolocation();

  const [markers, setMarkers] = useState<EquipmentMarker[]>([]);
  const [route, setRoute] = useState<LineString>(emptyLineString());
  const [routeVersion, setRouteVersion] = useState(0);
  const [activeMarkerId, setActiveMarkerId] = useState<string | null>(null);

  const mapRef = useRef<L.Map | null>(null);
  const markerDataRef = useRef(new WeakMap<L.Marker, EquipmentMarker>());
  const [showLogMode, setShowLogMode] = useState(false);
  console.log(LogPositions);
  const isClusterSelected = (cluster: MarkerClusterLike) => {
    return cluster.getAllChildMarkers().some((m) => {
      const data = markerDataRef.current.get(m);
      return data?.id === selectedEquipmentId;
    });
  };

  // --- Farget cluster

  const createClusterIcon = (cluster: MarkerClusterLike) => {
    const selected = isClusterSelected(cluster);

    return L.divIcon({
      className: "marker-cluster marker-cluster-custom",
      html: `
      <div class="
        flex h-10 w-10 items-center justify-center rounded-full border-2 border-black
        ${selected ? "bg-green-700" : "bg-blue-600"}
        text-sm font-bold text-white shadow-md
      ">
        ${cluster.getChildCount()}
      </div>
    `,
      iconSize: L.point(40, 40, true),
    });
  };

  useEffect(() => {
    const ac = new AbortController();

    const fetchMarkers = async () => {
      const params = new URLSearchParams();

      if (filters.committee.length > 0) {
        filters.committee.forEach((c) => params.append("committee", c));
      }
      if (filters.distance > 0 && latitude != null && longitude != null) {
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

      const token = localStorage.getItem("token");
      const headers: HeadersInit = token
        ? { Authorization: `Bearer ${token}` }
        : {};

      try {
        const res = await fetch(`${API_BASE}/locations/?${params.toString()}`, {
          headers,
          signal: ac.signal,
        });
        if (!res.ok) {
          console.error("Failed to fetch locations:", res.status);
          return;
        }
        const data: EquipmentMarker[] = await res.json();
        setMarkers(data);
      } catch (err) {
        if ((err as Error).name !== "AbortError") {
          console.error("Error fetching markers:", err);
        }
      }
    };

    fetchMarkers();
    return () => ac.abort();
  }, [
    filters.committee,
    filters.distance,
    filters.typeOfEquipment,
    filters.available,
    latitude,
    longitude,
  ]);

  const fetchLog = async (equipmentId: string) => {
    try {
      const token = localStorage.getItem("token");

      const res = await fetch(`${API_BASE}/booking/log/${equipmentId}`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });

      const data = await res.json();
      setLogPositions(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error(err);
    }
  };

  // --- Effect 2: hent rute --------------------------------------------------
  useEffect(() => {
    const canRoute =
      coordinates !== null && latitude != null && longitude != null;

    if (!canRoute) {
      startTransition(() => {
        setRoute(emptyLineString());
        onRoutePanelChange({ status: "idle" });
      });
      return;
    }

    const ac = new AbortController();

    const fetchRoute = async () => {
      onRoutePanelChange({ status: "loading" });
      try {
        const url =
          `${API_BASE}/route/?start_lat=${latitude}&start_lng=${longitude}` +
          `&end_lat=${coordinates.lat}&end_lng=${coordinates.lng}&mode=${travelMode}`;

        const res = await fetch(url, { signal: ac.signal });
        const data: unknown = await res.json();

        if (!res.ok || !isValidRoutePayload(data)) {
          if (
            data &&
            typeof data === "object" &&
            "detail" in data &&
            typeof (data as { detail: unknown }).detail === "string"
          ) {
            console.warn("Rute-API:", (data as { detail: string }).detail);
          }
          setRoute(emptyLineString());
          onRoutePanelChange({ status: "error" });
        } else if (data.coordinates.length === 0 || (data.meters ?? 0) <= 0) {
          setRoute(emptyLineString());
          onRoutePanelChange({ status: "no_route" });
        } else {
          setRoute(data);
          onRoutePanelChange({
            status: "ready",
            meters: data.meters ?? 0,
            seconds: data.seconds ?? 0,
          });
        }
        setRouteVersion((v) => v + 1);

        mapRef.current?.flyTo([coordinates.lat, coordinates.lng], 16, {
          duration: 0.6,
        });
      } catch (err) {
        if ((err as Error).name !== "AbortError") {
          console.error("Error fetching route:", err);
          setRoute(emptyLineString());
          onRoutePanelChange({ status: "error" });
          setRouteVersion((v) => v + 1);
        }
      }
    };

    fetchRoute();
    return () => ac.abort();
  }, [coordinates, latitude, longitude, travelMode, onRoutePanelChange]);

  // --- Log ------------------------------------------------------------------

  type Props = {
    logPositions: LogPosition[];
  };

  const [logPositions, setLogPositions] = useState<LogPosition[]>([]);

  // --- Render --------------------------------------------------------------

  return (
    <div className="relative h-screen w-full">
      <MapContainer
        ref={mapRef}
        center={TRONDHEIM_CENTER}
        zoom={16}
        style={{ height: "100%", width: "100%" }}
        zoomControl={false}
        className="absolute inset-0 z-0"
      >
        <TileLayer
          attribution="© OpenStreetMap contributors © Stadia Maps"
          url="https://tiles.stadiamaps.com/tiles/alidade_smooth/{z}/{x}/{y}{r}.png"
        />

        {coordinates && route.coordinates.length > 0 && (
          <GeoJSON
            key={`${travelMode}-${routeVersion}`}
            data={route}
            style={ROUTE_LINE_STYLE[travelMode]}
          />
        )}

        <MarkerClusterGroup
          key={selectedEquipmentId ?? "none"}
          chunkedLoading
          showCoverageOnHover={false}
          spiderfyOnMaxZoom={false}
          zoomToBoundsOnClick={false}
          iconCreateFunction={createClusterIcon}
          eventHandlers={{
            clustermouseover: (e: L.LeafletEvent) => {
              const cluster = (e as unknown as { layer: MarkerClusterLike })
                .layer;
              const children = cluster.getAllChildMarkers();

              const items = children
                .map((m) => markerDataRef.current.get(m))
                .filter((d): d is EquipmentMarker => Boolean(d));

              if (items.length === 0) return;

              const html = `
                <div class="min-w-52">
                  <ul class="space-y-1 text-sm">
                    ${items
                      .map(
                        (item) =>
                          `<li class="rounded px-2 py-1">${item.name}</li>`,
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
            clustermouseout: (e: L.LeafletEvent) => {
              const cluster = (e as unknown as { layer: MarkerClusterLike })
                .layer;
              cluster.closeTooltip();
              cluster.unbindTooltip();
            },
          }}
        >
          {!showLogMode &&
            markers.map((marker) => (
              <Marker
                key={marker.id}
                position={[marker.lat, marker.lng]}
                icon={
                  selectedEquipmentId === marker.id ? ICON_ACTIVE : ICON_IDLE
                }
                ref={(ref) => {
                  if (ref) markerDataRef.current.set(ref, marker);
                }}
                eventHandlers={{
                  click: () => {
                    setActiveMarkerId((prev) =>
                      prev === marker.id ? null : marker.id,
                    );
                    fetchLog(marker.id);
                  },
                }}
              >
                <Tooltip direction="top" offset={[0, -10]} opacity={1}>
                  <div className="min-w-32 px-2 py-1 text-sm">
                    {marker.name}
                  </div>
                </Tooltip>
              </Marker>
            ))}
        </MarkerClusterGroup>

        <LogMapLayer logPositions={LogPositions} 
        />

        <UserLocationMarker />
      </MapContainer>
    </div>
  );
};
