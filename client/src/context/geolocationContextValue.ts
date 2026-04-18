/**
 * The raw React context for geolocation state.
 * Separated from the Provider component to satisfy Vite Fast Refresh
 * (which requires files to export only components OR only non-components).
 *
 * You should NOT import this directly — use useUserLocation() from
 * "../hooks/useUserLocation" instead.
 */
import { createContext } from "react";
import type { GeolocationState } from "../hooks/useGeolocation";

export const GeolocationContext = createContext<GeolocationState | null>(null);
