/**
 * useGeolocation — low-level hook that wraps the browser Geolocation API.
 *
 * This is the foundation for all location features in the app.
 * You normally don't call this directly — instead use useUserLocation()
 * from GeolocationContext, which shares a single watcher across the app.
 *
 * HOW IT WORKS:
 *  - Calls navigator.geolocation.watchPosition() on mount.
 *  - Updates state every time the browser delivers a new position.
 *  - Cleans up the watcher on unmount.
 *
 * RETURN VALUE:
 *  { latitude, longitude, accuracy, error, loading }
 *  - latitude/longitude: null until the first GPS fix arrives.
 *  - accuracy: radius in meters of the confidence circle.
 *  - error: string message if permission denied or GPS unavailable.
 *  - loading: true until the first fix or error.
 *
 * OPTIONS:
 *  - enableHighAccuracy (default true): use GPS instead of Wi-Fi/cell.
 *  - maximumAge (default 5000ms): accept a cached position up to this old.
 *  - timeout (default 10000ms): max wait time for a position.
 */
import { useState, useEffect, useRef, useCallback } from "react";

export interface GeolocationState {
  latitude: number | null;
  longitude: number | null;
  accuracy: number | null;
  error: string | null;
  loading: boolean;
}

const defaultState: GeolocationState = {
  latitude: null,
  longitude: null,
  accuracy: null,
  error: null,
  loading: true,
};

export interface UseGeolocationOptions {
  enableHighAccuracy?: boolean;
  maximumAge?: number;
  timeout?: number;
}

export function useGeolocation(options?: UseGeolocationOptions): GeolocationState {
  const supported = typeof navigator !== "undefined" && !!navigator.geolocation;

  const [state, setState] = useState<GeolocationState>({
    ...defaultState,
    ...(supported ? {} : { error: "Geolocation is not supported by this browser.", loading: false }),
  });
  const watchIdRef = useRef<number | null>(null);

  const onSuccess = useCallback((position: GeolocationPosition) => {
    setState({
      latitude: position.coords.latitude,
      longitude: position.coords.longitude,
      accuracy: position.coords.accuracy,
      error: null,
      loading: false,
    });
  }, []);

  const onError = useCallback((err: GeolocationPositionError) => {
    setState((prev) => ({
      ...prev,
      error: err.message,
      loading: false,
    }));
  }, []);

  useEffect(() => {
    if (!supported) {
      return;
    }

    const watchOptions: PositionOptions = {
      enableHighAccuracy: options?.enableHighAccuracy ?? true,
      maximumAge: options?.maximumAge ?? 5000,
      timeout: options?.timeout ?? 10000,
    };

    watchIdRef.current = navigator.geolocation.watchPosition(
      onSuccess,
      onError,
      watchOptions,
    );

    return () => {
      if (watchIdRef.current !== null) {
        navigator.geolocation.clearWatch(watchIdRef.current);
      }
    };
  }, [supported, onSuccess, onError, options?.enableHighAccuracy, options?.maximumAge, options?.timeout]);

  return state;
}
