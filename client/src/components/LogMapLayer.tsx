import { Marker, Tooltip, Polyline } from "react-leaflet";
import L from "leaflet";
import { useEffect, useMemo, useState } from "react";
import { Button } from "react-bootstrap";
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import StopIcon from '@mui/icons-material/Stop';

export type LogPosition = {
    lat: number;
    lng: number;
    start_time: string;
};

type Props = {
    logPositions: LogPosition[];
    currentPosition?: { lat: number; lng: number } | null;
};

const createLogIcon = (i: number) =>
    L.divIcon({
        className: "",
        html: `<div class="h-4 w-4 rounded-full bg-green-800  border border-black">
            <span class="ml-4 text-black font-bold text-sm">#${i + 1}</span></div>`,
        iconSize: [10, 10],
        iconAnchor: [5, 5],
    });

const createNowIcon = () =>
    L.divIcon({
        className: "",
        html: `
      <div style="display:flex; align-items:center; gap:6px;">
        <div class="h-4 w-4 rounded-full bg-green-800 border border-black"></div>
        <span class="text-black font-bold text-sm">#Nå</span>
      </div>
    `,
        iconSize: [60, 20],
        iconAnchor: [6, 10],
    });

// --- MovingDot stil ----
const movingDotIcon = L.divIcon({
    className: "",
    html: `<div style="
    width:12px;
    height:12px;
    border-radius:50%;
    background:green;
    border:2px solid black;
    box-shadow:0 0 6px rgba(0,0,0,0.4);
  "></div>`,
    iconSize: [12, 12],
    iconAnchor: [6, 6],
});


// ----


export const LogMapLayer = ({ logPositions, currentPosition }: Props) => {
    const [progress, setProgress] = useState(0);
    const [isPlaying, setPlaying] = useState(true);
    const livePoint = currentPosition;

    const sortede = useMemo(() => { //Brukes ikke nå
        return [...logPositions].sort(
            (a, b) =>
                new Date(a.start_time).getTime() - new Date(b.start_time).getTime(),
        );
    }, [logPositions, currentPosition]);


    const sorted = useMemo(() => {
        return [...logPositions].sort(
            (a, b) =>
                new Date(b.start_time).getTime() -
                new Date(a.start_time).getTime()
        );
    }, [logPositions]);

    const isAtStart = progress === 0;
    const isAtEnd = progress === 1;
    const hasEnoughLog = sorted.length >= 2;

    const showDot =
        sorted.length > 1 &&
        progress > 0 &&
        progress < 1;


    const toggleLog = () => {
        setPlaying((prev) => {
            if (!prev && progress >= 1) {
                setProgress(0);
            }
            return !prev;
        });
    };

    //----MovingDot funksjon
    useEffect(() => {
        if (!isPlaying) return;
        if (sorted.length < 2) return;

        let frame: number;

        const animate = () => {
            setProgress((p) => {
                const next = p + 0.005; // hastighet

                if (next >= 1) {
                    setPlaying(false);
                    return 1;
                }

                return next > 1 ? 0 : next;
            });

            frame = requestAnimationFrame(animate);
        };
        frame = requestAnimationFrame(animate);
        return () => cancelAnimationFrame(frame);
    }, [sorted, isPlaying]);


    const getPoint = (points: any[], t: number) => {
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

    const path = useMemo(() => {
        const history = [...logPositions].sort(
            (a, b) =>
                new Date(a.start_time).getTime() -
                new Date(b.start_time).getTime()
        );

        return currentPosition
            ? [...history, currentPosition]
            : history;
    }, [logPositions, currentPosition]);

    const basePath = currentPosition
        ? [currentPosition, ...sorted]
        : sorted;

    const movingPos =
        basePath.length > 1 ? getPoint(basePath, progress) : null;

    const polylinePositions: [number, number][] = [
        ...(currentPosition
            ? [[currentPosition.lat, currentPosition.lng] as [number, number]]
            : []),
        ...sorted.map((p): [number, number] => [p.lat, p.lng]),
    ];

    //---

    return (
        <>
            {/* Linje mellom punkter */}
            {hasEnoughLog && (
                <Polyline positions={polylinePositions}
                    pathOptions={{ color: "green", weight: 2, dashArray: "2 5" }}
                />)}

            {currentPosition && (
                <Marker
                    position={[currentPosition.lat, currentPosition.lng]}
                    icon={createNowIcon()}
                >
                    <Tooltip>Nåværende posisjon</Tooltip>
                </Marker>
            )}
            {hasEnoughLog &&
                sorted.map((p, i) => (
                    <Marker
                        key={`${p.lat}-${p.lng}-${p.start_time}`}
                        position={[p.lat, p.lng]}
                        icon={createLogIcon(i)}
                    >
                        <Tooltip>
                            <div>
                                <div className="font-semibold">#1 er forrige sted utstyret ble booket, #2 før der igjen osv.
                                </div>
                                {/* <div>{new Date(p.start_time).toLocaleString()}</div> TODO: fikse denne? */}
                            </div>
                        </Tooltip>
                    </Marker>
                ))}


            {logPositions.length > 0 && (
                <Button onClick={toggleLog}
                    className="absolute text-xl cursor-pointer top-22 right-200 z-[9999]">
                    {isPlaying ? (
                        <>
                            Stopp animasjon <StopIcon />
                        </>
                    ) : (
                        <>
                            Start animasjon <PlayArrowIcon />
                        </>
                    )}
                </Button>
            )}

            {movingPos && showDot && (
                <Marker
                    zIndexOffset={100}
                    position={[movingPos.lat, movingPos.lng]}
                    icon={movingDotIcon}
                />
            )}
        </>
    );
};
