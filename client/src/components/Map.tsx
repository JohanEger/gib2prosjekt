import {
  MapContainer,
  TileLayer,
  Marker,
  GeoJSON,
  Polyline,
  Tooltip,
  useMapEvents,
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
import L from "leaflet";
import { UserLocationMarker } from "./UserLocationMarker";
import {
  ROUTE_LINE_STYLE,
  type RouteTravelMode,
} from "../types/routeTravelMode";
import type { RoutePanelState } from "../types/routePanelState";
import type { EquipmentFilters } from "../types/equipmentFilters";
import type { Equipment } from "../types/equipment";
import type { RouteLiveVehicle, RouteResponse } from "../types/routeResponse";
import { useGeolocation } from "../hooks/useGeolocation";
import { API_BASE } from "../apiBase";
import "leaflet.markercluster/dist/MarkerCluster.css";
import "leaflet.markercluster/dist/MarkerCluster.Default.css";
import MapControl from "./MapControl";

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

type ResetClusterFilterOnMapClickProps = {
  onReset: () => void;
};

interface MapProps {
  filters: EquipmentFilters;
  coordinates: Coordinates | null;
  travelMode: RouteTravelMode;
  onRoutePanelChange: Dispatch<SetStateAction<RoutePanelState>>;
  activeEquipment: Equipment | null;
  setActiveEquipment: Dispatch<SetStateAction<Equipment | null>>;
  setSelectedClusterEquipmentIds: Dispatch<SetStateAction<string[] | null>>;
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

const emptyRouteResponse = (): RouteResponse => ({
  type: "LineString",
  coordinates: [],
  meters: 0,
  seconds: 0,
});

const ResetClusterFilterOnMapClick = ({
  onReset,
}: ResetClusterFilterOnMapClickProps) => {
  useMapEvents({
    click: () => {
      onReset();
    },
  });

  return null;
};

const makeEquipmentIcon = (active: boolean) =>
  L.divIcon({
    className: "",
    html: `<div class="h-4 w-4 rounded-full border-2 border-black ${
      active ? "bg-blue-600" : "bg-zinc-400"
    }"></div>`,
    iconSize: [16, 16],
    iconAnchor: [8, 8],
  });

const ICON_IDLE = makeEquipmentIcon(false);
const ICON_ACTIVE = makeEquipmentIcon(true);
const makeLiveBusIcon = (linePublicCode?: string | null) =>
  L.divIcon({
    className: "",
    html: `<div class="flex h-8 w-8 items-center justify-center rounded-full border-2 border-white bg-violet-600 text-[11px] font-bold text-white shadow-lg">${linePublicCode ?? "B"}</div>`,
    iconSize: [32, 32],
    iconAnchor: [16, 16],
  });

const createClusterIcon = (cluster: MarkerClusterLike) =>
  L.divIcon({
    className: "marker-cluster marker-cluster-custom",
    html: `<div class="flex h-10 w-10 items-center justify-center rounded-full border-2 border-black bg-blue-600 text-sm font-bold text-white shadow-md">${cluster.getChildCount()}</div>`,
    iconSize: L.point(40, 40, true),
  });

const TRANSIT_LEG_STYLE = {
  foot: {
    color: "#38bdf8",
    weight: 5,
    opacity: 0.95,
    dashArray: "10 10",
  },
  bus: {
    color: "#a855f7",
    weight: 7,
    opacity: 0.95,
  },
} as const;

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
  activeEquipment,
  setActiveEquipment,
  setSelectedClusterEquipmentIds,
}: MapProps) => {
  const { latitude, longitude } = useGeolocation();

  const [markers, setMarkers] = useState<EquipmentMarker[]>([]);
  const [route, setRoute] = useState<RouteResponse>(emptyRouteResponse());
  const [routeVersion, setRouteVersion] = useState(0);

  const mapRef = useRef<L.Map | null>(null);
  const markerDataRef = useRef(new WeakMap<L.Marker, EquipmentMarker>());
  const [mapType, setMapType] = useState<string>("alidade_smooth");

  const getEquipment = async (id: string) => {
    try {
      const token = localStorage.getItem("token");

      const res = await fetch(`${API_BASE}/equipment/${id}`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      if (!res.ok) {
        console.error("Failed to fetch equipment:", res.status);
        return null;
      }

      const data: Equipment = await res.json();
      setActiveEquipment(data);
    } catch (err) {
      console.error("Error fetching equipment:", err);
    }
  };

  // --- Effect 1: hent markers ----------------------------------------------
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

  // --- Effect 2: fly til markerte koordinater --------------------------------------
  useEffect(() => {
    if (!activeEquipment || !mapRef.current) return;

    mapRef.current.flyTo([activeEquipment.lat, activeEquipment.lng], 16, {
      duration: 0.6,
    });
  }, [activeEquipment]);

  // --- Effect 3: hent rute --------------------------------------------------
  useEffect(() => {
    const canRoute =
      coordinates !== null && latitude != null && longitude != null;

    if (!canRoute) {
      startTransition(() => {
        setRoute(emptyRouteResponse());
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
          setRoute(emptyRouteResponse());
          onRoutePanelChange({ status: "error" });
        } else if ((data.meters ?? 0) <= 0) {
          setRoute(emptyRouteResponse());
          onRoutePanelChange({ status: "no_route" });
        } else {
          setRoute(data);
          onRoutePanelChange({
            status: "ready",
            meters: data.meters ?? 0,
            seconds: data.seconds ?? 0,
            transit: data.transit,
          });
          if (mapRef.current && data.coordinates.length > 0) {
            const LatLngs = data.coordinates.map(
              ([lng, lat]) => [lat, lng] as [number, number],
            );
            const bounds = L.latLngBounds(LatLngs);

            mapRef.current.fitBounds(bounds, {
              padding: [50, 50],
              animate: true,
            });
          }
        }
        setRouteVersion((v) => v + 1);
      } catch (err) {
        if ((err as Error).name !== "AbortError") {
          console.error("Error fetching route:", err);
          setRoute(emptyRouteResponse());
          onRoutePanelChange({ status: "error" });
          setRouteVersion((v) => v + 1);
        }
      }
    };

    fetchRoute();
    return () => ac.abort();
  }, [coordinates, latitude, longitude, travelMode, onRoutePanelChange]);

  const liveVehicles: RouteLiveVehicle[] = route.transit
    ? route.transit.legs
        .filter((leg) => leg.mode === "bus" && leg.liveVehicle)
        .map((leg) => leg.liveVehicle as RouteLiveVehicle)
    : [];
  const transitLegs = route.transit?.legs ?? [];

  // --- Render --------------------------------------------------------------

  return (
    <div className="relative h-screen w-full">
      <div className="absolute bottom-6 right-4 z-30">
        <div className="bg-white rounded-xl shadow-lg border p-2">
          <MapControl setMap={setMapType} />
        </div>
      </div>
      <MapContainer
        ref={mapRef}
        center={TRONDHEIM_CENTER}
        zoom={16}
        style={{ height: "100%", width: "100%" }}
        zoomControl={false}
        className="absolute inset-0 z-0"
      >
        <ResetClusterFilterOnMapClick
          onReset={() => setSelectedClusterEquipmentIds(null)}
        />

        {mapType == "satellite" ? (
          <TileLayer
            attribution="© OpenStreetMap contributors © Stadia Maps © Esri"
            url={
              mapType === "satellite"
                ? "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
                : `https://tiles.stadiamaps.com/tiles/${mapType}/{z}/{x}/{y}{r}.png`
            }
          />
        ) : (
          <TileLayer
            attribution="© OpenStreetMap contributors © Stadia Maps"
            url={`https://tiles.stadiamaps.com/tiles/${mapType}/{z}/{x}/{y}{r}.png`}
          />
        )}

        {travelMode !== "bus" && coordinates && route.coordinates.length > 0 && (
          <GeoJSON
            key={`${travelMode}-${routeVersion}`}
            data={route}
            style={ROUTE_LINE_STYLE[travelMode]}
          />
        )}

        {travelMode === "bus" &&
          transitLegs.map((leg, index) => {
            if (leg.coordinates.length === 0) return null;

            return (
              <Polyline
                key={`${leg.mode}-${leg.serviceJourneyId ?? index}-${routeVersion}`}
                positions={leg.coordinates.map(([lng, lat]) => [lat, lng] as [number, number])}
                pathOptions={TRANSIT_LEG_STYLE[leg.mode]}
              >
                <Tooltip direction="top" offset={[0, -6]} opacity={1}>
                  <div className="min-w-28 px-2 py-1 text-sm">
                    <div className="font-semibold">
                      {leg.mode === "bus" ? leg.linePublicCode ?? "?" : "Gå"}
                    </div>
                    <div>
                      {leg.fromName ?? "Start"} til {leg.toName ?? "Mål"}
                    </div>
                  </div>
                </Tooltip>
              </Polyline>
            );
          })}

        {travelMode === "bus" &&
          liveVehicles.map((vehicle) => (
            <Marker
              key={`${vehicle.serviceJourneyId}-${vehicle.date}`}
              position={[vehicle.latitude, vehicle.longitude]}
              icon={makeLiveBusIcon(vehicle.linePublicCode)}
            >
              <Tooltip direction="top" offset={[0, -10]} opacity={1}>
                <div className="min-w-36 px-2 py-1 text-sm">
                  <div className="font-semibold">
                    {vehicle.linePublicCode ?? ""}
                  </div>
                  <div>{vehicle.destinationName ?? "Live-posisjon"}</div>
                </div>
              </Tooltip>
            </Marker>
          ))}

        <MarkerClusterGroup
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
            clusterclick: (e: L.LeafletEvent) => {
              const cluster = (e as unknown as { layer: MarkerClusterLike })
                .layer;
              const children = cluster.getAllChildMarkers();

              const items = children
                .map((m) => markerDataRef.current.get(m))
                .filter((d): d is EquipmentMarker => Boolean(d));

              setSelectedClusterEquipmentIds(items.map((item) => item.id));
            },
          }}
        >
          {markers.map((marker) => (
            <Marker
              key={marker.id}
              position={[marker.lat, marker.lng]}
              icon={activeEquipment?.id === marker.id ? ICON_ACTIVE : ICON_IDLE}
              ref={(ref) => {
                if (ref) markerDataRef.current.set(ref, marker);
              }}
              eventHandlers={{
                click: () => {
                  setSelectedClusterEquipmentIds(null);
                  getEquipment(marker.id);
                },
              }}
            >
              <Tooltip direction="top" offset={[0, -10]} opacity={1}>
                <div className="min-w-32 px-2 py-1 text-sm">{marker.name}</div>
              </Tooltip>
            </Marker>
          ))}
        </MarkerClusterGroup>

        <UserLocationMarker />
      </MapContainer>
    </div>
  );
};
