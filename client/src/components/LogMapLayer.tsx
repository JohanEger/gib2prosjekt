import { Marker, Tooltip } from "react-leaflet";
import L from "leaflet";

export type LogPosition = {
  lat: number;
  lng: number;
  created_at: string;
};

type Props = {
  logPositions: LogPosition[];
};

export const LogMapLayer = ({ logPositions }: Props) => {
  const sorted = [...logPositions].sort(
    (a, b) =>
      new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
  );

  return (
    <>
      {sorted.map((p, i) => (
        <Marker
          key={i}
          position={[p.lat, p.lng]}
          icon={L.divIcon({
            className: "",
            html: `<div class="h-3 w-3 rounded-full bg-red-500 border border-black"></div>`,
            iconSize: [10, 10],
            iconAnchor: [5, 5],
          })}
        >
          <Tooltip>
            {new Date(p.created_at).toLocaleString()}
          </Tooltip>
        </Marker>
      ))}
    </>
  );
};