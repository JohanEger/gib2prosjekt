import { Typography, Box, Divider } from "@mui/material";
import Paper from "@mui/material/Paper";
import { useEffect, useState } from "react";
import { Button } from "react-bootstrap";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import CancelIcon from "@mui/icons-material/Cancel";
import DirectionsBusFilledIcon from "@mui/icons-material/DirectionsBusFilled";
import DirectionsWalkIcon from "@mui/icons-material/DirectionsWalk";
import LocationPinIcon from "@mui/icons-material/LocationPin";
import { Link } from "react-router-dom";
import { TravelModeSelector } from "./TravelModeSelector";
import { MODE_LABEL, type RouteTravelMode } from "../types/routeTravelMode";
import type { RoutePanelState } from "../types/routePanelState";
import { formatRouteDistance, formatRouteDuration } from "../utils/formatRoute";

type FunctionalStatus = "functional" | "lost" | "broken";

type Coordinates = {
  lat: number;
  lng: number;
};

type Props = {
  id: string;
  name: string;
  lat: number;
  lng: number;
  description: string;
  func: () => void;
  booked: boolean;
  functional_status: FunctionalStatus;
  functional_status_comment?: string | null;
  SetFindEquipment: React.Dispatch<React.SetStateAction<Coordinates | null>>;
  travelMode: RouteTravelMode;
  setTravelMode: React.Dispatch<React.SetStateAction<RouteTravelMode>>;
  routePanel: RoutePanelState;
  /** True når kart-ruten er beregnet til dette utstyrets posisjon */
  isRouteTarget: boolean;
};

export const EquipmentPopUp = ({
  name,
  lat,
  lng,
  description,
  id,
  func,
  booked,
  functional_status,
  functional_status_comment,
  SetFindEquipment,
  travelMode,
  setTravelMode,
  routePanel,
  isRouteTarget,
}: Props) => {
  const [address, setAddress] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const statusLabel: Record<FunctionalStatus, string> = {
  functional: "Alt i orden",
  broken: "Ødelagt",
  lost: "Tapt",
  };

  const formatClock = (value?: string | null) => {
    if (!value) return "Ukjent";
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return "Ukjent";
    return date.toLocaleTimeString("nb-NO", {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const formatDelay = (delaySeconds?: number | null) => {
    if (delaySeconds == null) return "Ingen live-data om forsinkelse";
    const minutes = Math.round(delaySeconds / 60);
    if (minutes === 0) return "I rute";
    return minutes > 0
      ? `${minutes} min forsinket`
      : `${Math.abs(minutes)} min foran skjema`;
  };

  useEffect(() => {
    async function loadAddress() {
      try {
        const res = await fetch(
          `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json`,
          {
            headers: {
              "User-Agent": "equipment-map-app",
            },
          },
        );

        const data = await res.json();

        const addr = data.address;

        setAddress(
          `${addr.road ?? ""} ${addr.house_number ?? ""}, ${addr.suburb ?? addr.city ?? ""}`,
        );
      } catch (err) {
        setAddress("Kunne ikke hente adresse");
      } finally {
        setLoading(false);
      }
    }

    loadAddress();
  }, [lat, lng]);

  return (
    <Paper
      elevation={3}
      className="fixed top-0 right-0 flex h-screen w-[30rem] flex-col items-center gap-4 overflow-y-auto bg-black pt-24 text-white"
    >
      <Typography variant="h4">{name}</Typography>

      <Paper className="flex items-center gap-2 px-4 py-2 rounded-full bg-black/20">
        {booked ? (
          <>
            <CancelIcon className="text-red-500" fontSize="small" />
            <Typography className="text-red-500 font-semibold">
              Booket
            </Typography>
          </>
        ) : (
          <>
            <CheckCircleIcon className="text-green-500" fontSize="small" />
            <Typography className="text-green-500 font-semibold">
              Ledig
            </Typography>
          </>
        )}
      </Paper>

      <Typography className="text-center px-6">
        {loading ? (
          "Laster adresse..."
        ) : (
          <>
            <LocationPinIcon fontSize="small" className="mr-1" />
            {address}
          </>
        )}
      </Typography>
      <Typography>{description}</Typography>

      <Link
        to={`/calendar/${id}/${name}`}
        className="mt-4 px-6 py-2 bg-gradient-to-r from-blue-500 to-indigo-600 
        hover:from-blue-600 hover:to-indigo-700
        text-white font-semibold rounded-xl shadow-lg
        transition-all duration-300 hover:scale-105 hover:shadow-xl"
      >
        Book utstyr
      </Link>

      <Link
          to={`/reportEquipment/${id}/${name}`}
          className="mt-4 px-6 py-2 bg-gradient-to-r from-blue-500 to-indigo-600 
          hover:from-blue-600 hover:to-indigo-700
          text-white font-semibold rounded-xl shadow-lg
          transition-all duration-300 hover:scale-105 hover:shadow-xl"
        >
        Meld tapt/ødelagt
      </Link>

      <Button
        onClick={() => SetFindEquipment({ lat, lng })}
        className="mt-4 px-6 py-2 bg-gradient-to-r from-blue-500 to-indigo-600 
  hover:from-blue-600 hover:to-indigo-700
  text-white font-semibold rounded-xl shadow-lg
  transition-all duration-300 hover:scale-105 hover:shadow-xl cursor-pointer"
      >
        Finn vei
      </Button>

      <div className="w-full max-w-[22rem] px-4 pb-10">
        <TravelModeSelector
          variant="dark"
          value={travelMode}
          onChange={setTravelMode}
          className="mt-2 text-left"
        />

        {isRouteTarget ? (
          <div className="mt-5 rounded-xl border border-zinc-500/90 bg-zinc-950/90 p-4 text-left shadow-inner">
            <div className="mb-3 flex items-center justify-between gap-2">
              <h3 className="text-sm font-semibold tracking-tight text-white">
                Ruteinformasjon
              </h3>
              {routePanel.status === "ready" && (
                <span className="shrink-0 rounded-full border border-sky-400/60 bg-sky-500/20 px-2.5 py-0.5 text-[11px] font-semibold text-sky-100">
                  {MODE_LABEL[travelMode]}
                </span>
              )}
            </div>

            {(routePanel.status === "idle" ||
              routePanel.status === "loading") && (
              <p className="text-sm font-medium text-sky-200/90">
                {routePanel.status === "loading"
                  ? "Beregner rute…"
                  : "Henter posisjon og rute…"}
              </p>
            )}

            {routePanel.status === "ready" && (
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-2">
                  <div className="rounded-lg border border-zinc-600/80 bg-zinc-900/80 px-3 py-2.5">
                    <div className="text-[10px] font-semibold uppercase tracking-wider text-zinc-400">
                      Tid
                    </div>
                    <div className="mt-1 text-lg font-bold text-white">
                      {formatRouteDuration(routePanel.seconds)}
                    </div>
                  </div>
                  <div className="rounded-lg border border-zinc-600/80 bg-zinc-900/80 px-3 py-2.5">
                    <div className="text-[10px] font-semibold uppercase tracking-wider text-zinc-400">
                      Avstand
                    </div>
                    <div className="mt-1 text-lg font-bold text-white">
                      {formatRouteDistance(routePanel.meters)}
                    </div>
                  </div>
                </div>

                {travelMode === "bus" && routePanel.transit && (
                  <div className="space-y-2 rounded-lg border border-violet-500/40 bg-violet-500/10 p-3">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="text-xs font-semibold uppercase tracking-wider text-violet-200">
                        Kollektivdetaljer
                      </div>
                      <div className="flex flex-wrap gap-2">
                        <span className="inline-flex items-center gap-1 rounded-full border border-sky-400/40 bg-sky-500/15 px-2 py-1 text-[11px] font-semibold text-sky-100">
                          <DirectionsWalkIcon sx={{ fontSize: 14 }} />
                          Gå
                        </span>
                        <span className="inline-flex items-center gap-1 rounded-full border border-violet-400/40 bg-violet-500/20 px-2 py-1 text-[11px] font-semibold text-violet-100">
                          <DirectionsBusFilledIcon sx={{ fontSize: 14 }} />
                          Buss
                        </span>
                      </div>
                    </div>
                    <div className="text-sm text-violet-50">
                      Gange totalt:{" "}
                      <span className="font-semibold">
                        {formatRouteDistance(routePanel.transit.walkMeters)}
                      </span>
                    </div>

                    <div className="space-y-2">
                      {routePanel.transit.legs.map((leg, index) => (
                        <div
                          key={`${leg.mode}-${leg.serviceJourneyId ?? index}`}
                          className={`rounded-lg border px-3 py-2.5 ${
                            leg.mode === "bus"
                              ? "border-violet-400/50 bg-violet-950/40 shadow-[0_0_0_1px_rgba(139,92,246,0.12)]"
                              : "border-sky-400/40 bg-sky-950/30 shadow-[0_0_0_1px_rgba(56,189,248,0.10)]"
                          }`}
                        >
                          <div className="flex items-center justify-between gap-3">
                            <div className="flex items-center gap-2">
                              <span
                                className={`inline-flex items-center gap-1 rounded-full px-2 py-1 text-[11px] font-semibold ${
                                  leg.mode === "bus"
                                    ? "bg-violet-500/25 text-violet-100"
                                    : "bg-sky-500/20 text-sky-100"
                                }`}
                              >
                                {leg.mode === "bus" ? (
                                  <DirectionsBusFilledIcon sx={{ fontSize: 14 }} />
                                ) : (
                                  <DirectionsWalkIcon sx={{ fontSize: 14 }} />
                                )}
                                {leg.mode === "bus" ? "Buss" : "Gå"}
                              </span>
                              <div className="text-sm font-semibold text-white">
                                {leg.mode === "bus"
                                  ? `${leg.linePublicCode ?? "?"}`
                                  : "Gangetappe"}
                              </div>
                            </div>
                            <div className="text-xs text-zinc-400">
                              {formatRouteDuration(leg.seconds)}
                            </div>
                          </div>

                          <div className="mt-1 text-xs text-zinc-300">
                            {leg.fromName ?? "Start"} til {leg.toName ?? "Mål"}
                          </div>
                          <div className="mt-1 text-xs text-zinc-400">
                            {formatClock(leg.expectedStartTime)} -{" "}
                            {formatClock(leg.expectedEndTime)}
                          </div>

                          {leg.mode === "bus" && (
                            <div className="mt-2 space-y-1 text-xs">
                              <div className="text-violet-100">
                                {leg.authorityName ?? "Kollektivoperatør"}
                              </div>
                              {leg.liveVehicle ? (
                                <>
                                  <div className="text-emerald-300">
                                    Live: {formatDelay(leg.liveVehicle.delaySeconds)}
                                  </div>
                                  <div className="text-zinc-400">
                                    Sist oppdatert{" "}
                                    {formatClock(leg.liveVehicle.lastUpdated)}
                                  </div>
                                </>
                              ) : (
                                <div className="text-zinc-500">
                                  Ingen live-posisjon funnet for denne avgangen.
                                </div>
                              )}
                            </div>
                          )}

                          {leg.mode === "foot" && (
                            <div className="mt-2 text-xs text-sky-100/90">
                              Til fots mellom holdeplassene eller til/fra målet.
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {routePanel.status === "no_route" && (
              <p className="text-sm text-amber-200/90">
                Fant ingen rute mellom din posisjon og dette punktet. Prøv et
                annet transportmiddel eller sjekk at GPS er aktivert.
              </p>
            )}

            {routePanel.status === "error" && (
              <p className="text-sm text-red-300">
                Klarte ikke å hente rute akkurat nå. Prøv igjen om litt.
              </p>
            )}
          </div>
        ) : (
          <p className="mt-4 text-center text-xs text-zinc-500">
            Ruteinformasjon vises her når du trykker «Finn vei» for dette
            utstyret.
          </p>
        )}
      </div>

      <div className="mt-auto w-full max-w-[22rem] px-4 pb-8">
        <div className="rounded-xl border border-zinc-300 bg-white p-4 text-center shadow-sm">
          <div className="space-y-3">
            <div>
              <div className="text-[11px] font-semibold uppercase tracking-wider text-zinc-500">
                Status
              </div>
              <div
                className={`mt-1 text-sm font-semibold ${
                  functional_status === "functional"
                    ? "text-green-500"
                    : functional_status === "broken"
                      ? "text-red-500"
                      : "text-amber-500"
                }`}
              >
                {statusLabel[functional_status]}
              </div>
            </div>

            <div>
              <div className="text-[11px] font-semibold uppercase tracking-wider text-zinc-500">
                Kommentar
              </div>
              <div className="mt-1 text-sm text-zinc-700">
                {functional_status_comment || "Ingen kommentar"}
              </div>
            </div>
          </div>
        </div>
      </div>
    
    </Paper>
  );
};
