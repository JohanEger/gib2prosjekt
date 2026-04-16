import { Marker, Tooltip, Polyline } from "react-leaflet";
import L from "leaflet";
import { useEffect, useMemo, useState } from "react";
import { LogPopUp } from "./LogPopUp";

export type LogPosition = {
    lat: number;
    lng: number;
    start_time: string;
};

type Props = {
    logPositions: LogPosition[];
};

const createLogIcon = (i: number) =>
    L.divIcon({
        className: "",
        html: `<div class="h-4 w-4 rounded-full bg-red-600  border border-black}">
  <span class="ml-4 text-black font-bold text-sm">#${i + 1}</span></div>`,
        iconSize: [10, 10],
        iconAnchor: [5, 5],
    });

export const LogMapLayer = ({ logPositions }: Props) => {
    const [progress, setProgress] = useState(0);
    const [isPlaying, setPlaying] = useState(true);
    const sorted = useMemo(() => {
        return [...logPositions].sort(
            (a, b) =>
                new Date(a.start_time).getTime() - new Date(b.start_time).getTime(),
        );
    }, [logPositions]);


    return (
        <>
            {/* Linje mellom punkter */}
            <Polyline
                positions={sorted.map((p) => [p.lat, p.lng])}
                pathOptions={{ color: "red", weight: 2, dashArray: "2 4" }}
            />

            {sorted.map((p, i) => (
                <Marker
                    key={`${p.lat}-${p.lng}-${p.start_time}`}
                    position={[p.lat, p.lng]}
                    icon={createLogIcon(i)}
                >
                    <Tooltip>
                        <div>
                            <div className="font-semibold">#{i + 1}</div>
                            <div>{new Date(p.start_time).toLocaleString()}</div>
                        </div>
                    </Tooltip>
                </Marker>
            ))}
        </>
    );
};
