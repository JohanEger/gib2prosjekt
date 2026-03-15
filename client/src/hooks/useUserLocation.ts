/**
 * useUserLocation — consumer hook for the GeolocationContext.
 *
 * Call this in any component to get the user's live GPS position:
 *
 *   import { useUserLocation } from "../hooks/useUserLocation";
 *
 *   const { latitude, longitude, accuracy, error, loading } = useUserLocation();
 *
 * EXAMPLE — find the nearest item from a list fetched from the DB:
 *
 *   const { latitude, longitude } = useUserLocation();
 *   const [items, setItems] = useState<Item[]>([]);
 *
 *   // Fetch items from your API / DB
 *   useEffect(() => {
 *     fetch("/api/items").then(r => r.json()).then(setItems);
 *   }, []);
 *
 *   // Sort by distance to user (straight-line / Haversine)
 *   const sorted = useMemo(() => {
 *     if (latitude === null || longitude === null) return items;
 *     return [...items].sort((a, b) =>
 *       haversine(latitude, longitude, a.lat, a.lng)
 *       - haversine(latitude, longitude, b.lat, b.lng)
 *     );
 *   }, [items, latitude, longitude]);
 *
 * EXAMPLE — send user position to the backend for a shortest-path query:
 *
 *   const { latitude, longitude } = useUserLocation();
 *
 *   const getRoute = async (destinationId: string) => {
 *     const res = await fetch(
 *       `/api/route?fromLat=${latitude}&fromLng=${longitude}&to=${destinationId}`
 *     );
 *     return res.json(); // e.g. { distance, duration, geometry }
 *   };
 *
 * NOTE: latitude/longitude are null until the browser delivers the first
 * GPS fix, so always guard with a null-check before using them.
 */
import { useContext } from "react";
import { GeolocationContext } from "../context/geolocationContextValue";
import type { GeolocationState } from "./useGeolocation";

export function useUserLocation(): GeolocationState {
  const context = useContext(GeolocationContext);
  if (context === null) {
    throw new Error("useUserLocation must be used within a <GeolocationProvider>");
  }
  return context;
}
