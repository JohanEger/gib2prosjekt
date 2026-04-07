/**
 * UserLocationMarker — renders the user's live position on the Leaflet map.
 *
 * Displays a blue dot (Google Maps style) with an accuracy circle.
 * On first GPS fix, the map flies to the user's position.
 *
 * This component consumes useUserLocation() from GeolocationContext,
 * so it must be rendered inside both <GeolocationProvider> and <MapContainer>.
 *
 * PROPS:
 *  - flyToOnFirstFix (default true): animate the map to the user on first fix.
 *  - flyToZoom (default 16): zoom level to fly to.
 *
 * If you want to build a "center on me" button, you can grab the map
 * instance with useMap() and call map.flyTo([latitude, longitude], zoom).
 */
import { useEffect, useRef, useState } from "react";
import { CircleMarker, Circle, useMap } from "react-leaflet";
import { useUserLocation } from "../hooks/useUserLocation";

interface UserLocationMarkerProps {
  flyToOnFirstFix?: boolean;
  flyToZoom?: number;
}

export const UserLocationMarker = ({
  flyToOnFirstFix = true,
  flyToZoom = 16,
}: UserLocationMarkerProps) => {
  const { latitude, longitude, accuracy } = useUserLocation();
  const map = useMap();
  const hasFlewRef = useRef(false);
  const [pulse, setPulse] = useState(true);

  useEffect(() => {
    if (
      latitude !== null &&
      longitude !== null &&
      flyToOnFirstFix &&
      !hasFlewRef.current
    ) {
      map.flyTo([latitude, longitude], flyToZoom, { duration: 1.5 });
      hasFlewRef.current = true;
    }
  }, [latitude, longitude, flyToOnFirstFix, flyToZoom, map]);

  useEffect(() => {
    const interval = setInterval(() => setPulse((p) => !p), 1000);
    return () => clearInterval(interval);
  }, []);

  if (latitude === null || longitude === null) return null;

  return (
    <>
      {accuracy !== null && (
        <Circle
          center={[latitude, longitude]}
          radius={accuracy}
          pathOptions={{
            color: "#4285f4",
            fillColor: "#4285f4",
            fillOpacity: 0.1,
            weight: 1,
          }}
        />
      )}
      <CircleMarker
        center={[latitude, longitude]}
        radius={pulse ? 9 : 8}
        pathOptions={{
          fillColor: "#4285f4",
          fillOpacity: 1,
          color: "#ffffff",
          weight: 3,
        }}
      />
    </>
  );
};
