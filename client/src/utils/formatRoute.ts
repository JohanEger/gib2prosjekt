export function formatRouteDistance(m: number): string {
  if (m < 1000) return `${Math.round(m)} m`;
  return `${(m / 1000).toFixed(1)} km`;
}

export function formatRouteDuration(s: number): string {
  if (s < 60) return `${Math.max(1, Math.round(s))} sek`;
  const mins = Math.round(s / 60);
  if (mins < 60) return `${mins} min`;
  const hours = Math.floor(mins / 60);
  const remMins = mins % 60;
  return remMins === 0 ? `${hours} t` : `${hours} t ${remMins} min`;
}
