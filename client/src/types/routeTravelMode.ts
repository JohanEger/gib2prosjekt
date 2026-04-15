import type L from "leaflet";

export type RouteTravelMode = "walk" | "bike" | "drive";

export const ROUTE_LINE_STYLE: Record<RouteTravelMode, L.PathOptions> = {
  walk: { color: "#2563eb", weight: 5 },
  bike: { color: "#16a34a", weight: 5 },
  drive: { color: "#dc2626", weight: 5 },
};

export const MODE_LABEL: Record<RouteTravelMode, string> = {
  walk: "Gå",
  bike: "Sykkel",
  drive: "Bil",
};
