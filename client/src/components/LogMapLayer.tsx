import { Marker, Tooltip, Polyline } from "react-leaflet";
import L from "leaflet";
import { useEffect, useMemo, useState } from "react";
import { parseDate } from "@internationalized/date";

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

// --- Bevegende dot ----
const movingDotIcon = L.divIcon({
    className: "",
    html: `<div style="
    width:12px;
    height:12px;
    border-radius:50%;
    background:red;
    border:2px solid black;
    box-shadow:0 0 6px rgba(0,0,0,0.4);
  "></div>`,
    iconSize: [12, 12],
    iconAnchor: [6, 6],
});


// ----

export const LogMapLayer = ({ logPositions }: Props) => {
    const [progress, setProgress] = useState(0);
    const [isPlaying, setPlaying] = useState(true);

    const sorted = useMemo(() => {
        return [...logPositions].sort(
            (a, b) =>
                new Date(a.start_time).getTime() - new Date(b.start_time).getTime(),
        );
    }, [logPositions]);



    //----MovingDot
    useEffect(() => {
        if (!isPlaying) return;
        if (sorted.length < 2) return;

        let frame: number;

        const animate = () => {
            setProgress((p) => {
                const next = p + 0.005; // hastighet 
                return next > 1 ? 0 : next;
            });
            frame = requestAnimationFrame(animate);
        };
        frame = requestAnimationFrame(animate);
        return () => cancelAnimationFrame(frame);
    }, [sorted]);

    const getPoint = (points: LogPosition[], t: number) => {
        const maxIndex = points.length - 1;
        const scaled = t * maxIndex;
        const i = Math.floor(scaled);
        const j = Math.min(i + 1, maxIndex);
        const localT = scaled - i;
        const a = points[i];
        const b = points[j];

        if (!a || !b)
            return a;
        return {
            lat: a.lat + (b.lat - a.lat) * localT,
            lng: a.lng + (b.lng - a.lng) * localT,

        };
    };
    const movingPos = sorted.length > 1 ? getPoint(sorted, progress) : null;
    const reversed = [...sorted].reverse();

    //---

    return (
        <>
            {/* Linje mellom punkter */}
            <Polyline
                positions={reversed.map((p) => [p.lat, p.lng])}
                pathOptions={{ color: "red", weight: 2, dashArray: "2 4" }}
            />

            {reversed.map((p, i) => (
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
            

            {movingPos && (
                <Marker
                    position={[movingPos.lat, movingPos.lng]}
                    icon={movingDotIcon}
                />
            )}
        </>
    );
};