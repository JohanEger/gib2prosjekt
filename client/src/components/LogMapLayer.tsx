import { Marker, Tooltip, Polyline } from "react-leaflet";
import L from "leaflet";
import { useMemo } from "react";

export type LogPosition = {
  lat: number;
  lng: number;
  created_at: string;
};

type Props = {
  logPositions: LogPosition[];
};

const logIcon = L.divIcon({
  className: "",
  html: `<div class="h-3 w-3 rounded-full bg-red-500 border border-black"></div>`,
  iconSize: [10, 10],
  iconAnchor: [5, 5],
});

export const LogMapLayer = ({ logPositions }: Props) => {
  const sorted = useMemo(() => {
    return [...logPositions].sort(
      (a, b) =>
        new Date(a.created_at).getTime() - new Date(b.created_at).getTime(),
    );
  }, [logPositions]);

  return (
    <>
      {/* Linje mellom punkter */}
      <Polyline
        positions={sorted.map((p) => [p.lat, p.lng])}
        pathOptions={{ color: "red" }}
      />

      {sorted.map((p, i) => (
        <Marker
          key={`${p.lat}-${p.lng}-${p.created_at}`}
          position={[p.lat, p.lng]}
          icon={logIcon}
        >
          <Tooltip>
            <div>
              <div className="font-semibold">#{i + 1}</div>
              <div>{new Date(p.created_at).toLocaleString()}</div>
            </div>
          </Tooltip>
        </Marker>
      ))}
    </>
  );
};
