/**
 * GeolocationProvider — wraps the app to provide live GPS position.
 *
 * Already wired in App.tsx. To consume the position, use the
 * useUserLocation() hook from "../hooks/useUserLocation".
 */
import { useGeolocation, type UseGeolocationOptions } from "../hooks/useGeolocation";
import { GeolocationContext } from "./geolocationContextValue";

interface GeolocationProviderProps {
  children: React.ReactNode;
  options?: UseGeolocationOptions;
}

export function GeolocationProvider({ children, options }: GeolocationProviderProps) {
  const geolocation = useGeolocation(options);

  return (
    <GeolocationContext.Provider value={geolocation}>
      {children}
    </GeolocationContext.Provider>
  );
}
