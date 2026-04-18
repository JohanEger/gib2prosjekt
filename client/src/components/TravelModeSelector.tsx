import type { ReactElement } from "react";
import {
  MdDirectionsBike,
  MdDirectionsBus,
  MdDirectionsCar,
  MdDirectionsWalk,
} from "react-icons/md";
import {
  MODE_LABEL,
  type RouteTravelMode,
} from "../types/routeTravelMode";

const MODE_ICON_CLASS = "h-4 w-4 shrink-0";

const MODE_ICON: Record<RouteTravelMode, ReactElement> = {
  walk: <MdDirectionsWalk className={MODE_ICON_CLASS} aria-hidden />,
  bike: <MdDirectionsBike className={MODE_ICON_CLASS} aria-hidden />,
  drive: <MdDirectionsCar className={MODE_ICON_CLASS} aria-hidden />,
  bus: <MdDirectionsBus className={MODE_ICON_CLASS} aria-hidden />,
};

const MODES: RouteTravelMode[] = ["walk", "bike", "drive", "bus"];

type TravelModeSelectorProps = {
  value: RouteTravelMode;
  onChange: (mode: RouteTravelMode) => void;
  /** Lys bakgrunn (kart-overlay) vs mørk (utstyr-popup) */
  variant?: "light" | "dark";
  className?: string;
};

export function TravelModeSelector({
  value,
  onChange,
  variant = "light",
  className = "",
}: TravelModeSelectorProps) {
  const isDark = variant === "dark";

  return (
    <div className={className}>
      <p
        className={`mb-2 text-sm font-semibold tracking-tight ${
          isDark ? "text-white" : "text-zinc-800"
        }`}
      >
        Velg transportmiddel
      </p>
      <div
        className={`grid grid-cols-4 gap-1.5 rounded-xl p-1.5 ${
          isDark
            ? "border border-zinc-500/90 bg-zinc-950 shadow-inner"
            : "border border-zinc-200 bg-zinc-100"
        }`}
      >
        {MODES.map((mode) => {
          const active = value === mode;
          return (
            <button
              key={mode}
              type="button"
              onClick={() => onChange(mode)}
              className={`flex min-h-[2.5rem] flex-col items-center justify-center gap-0.5 rounded-lg px-1.5 py-2 text-center text-[11px] font-medium leading-tight transition sm:flex-row sm:text-xs ${
                isDark
                  ? active
                    ? "border-2 border-sky-400 bg-white font-semibold text-zinc-900 shadow-md"
                    : "border border-zinc-600/80 bg-zinc-800/90 text-zinc-100 hover:border-zinc-500 hover:bg-zinc-800"
                  : active
                    ? "border-2 border-sky-500 bg-white font-semibold text-zinc-900 shadow-sm"
                    : "border border-transparent bg-white/60 text-zinc-700 hover:bg-white"
              }`}
            >
              {MODE_ICON[mode]}
              <span className="max-w-[4.5rem] sm:max-w-none">{MODE_LABEL[mode]}</span>
            </button>
          );
        })}
      </div>
      <p
        className={`mt-2 text-[11px] leading-snug ${
          isDark ? "text-zinc-400" : "text-zinc-500"
        }`}
      >
        Bussruter bruker Entur. Sanntidsdata kan mangle utenfor aktiv avgang.
      </p>
    </div>
  );
}
