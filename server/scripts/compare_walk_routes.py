import asyncio
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
if str(ROOT) not in sys.path:
    sys.path.insert(0, str(ROOT))

from app.routing.pipeline import RouteMode, compute_shortest_path
from app.services.entur import compute_walk_route


REFERENCE_CASES = [
    {
        "name": "Midtbyen til Ila",
        "start": (63.4318, 10.4039),
        "end": (63.422432, 10.348832),
    },
    {
        "name": "Midtbyen til Elgeseter",
        "start": (63.4318, 10.4039),
        "end": (63.41812, 10.403334),
    },
    {
        "name": "Midtbyen til Bakklandet vest",
        "start": (63.4318, 10.4039),
        "end": (63.426885, 10.377241),
    },
    {
        "name": "Midtbyen til Byaasen",
        "start": (63.4318, 10.4039),
        "end": (63.395751, 10.394386),
    },
    {
        "name": "Elgeseter til Ila",
        "start": (63.41812, 10.403334),
        "end": (63.422432, 10.348832),
    },
    {
        "name": "Bakklandet vest til Byaasen",
        "start": (63.426885, 10.377241),
        "end": (63.395751, 10.394386),
    },
    {
        "name": "Ila til Byaasen",
        "start": (63.422432, 10.348832),
        "end": (63.395751, 10.394386),
    },
    {
        "name": "Elgeseter til Bakklandet vest",
        "start": (63.41812, 10.403334),
        "end": (63.426885, 10.377241),
    },
]


def _fmt_delta(local_value: float, entur_value: float) -> str:
    if entur_value == 0:
        return "n/a"
    pct = ((local_value - entur_value) / entur_value) * 100
    return f"{pct:+.1f}%"


async def main() -> None:
    print(
        "Case".ljust(28),
        "Local m".rjust(10),
        "Entur m".rjust(10),
        "Delta".rjust(10),
        "Local min".rjust(12),
        "Entur min".rjust(12),
        "Delta".rjust(10),
    )
    print("-" * 96)

    for case in REFERENCE_CASES:
        start_lat, start_lng = case["start"]
        end_lat, end_lng = case["end"]

        local_route = compute_shortest_path(
            start_lat,
            start_lng,
            end_lat,
            end_lng,
            mode=RouteMode.walk,
        )
        entur_route = await compute_walk_route(
            start_lat,
            start_lng,
            end_lat,
            end_lng,
        )

        local_m = float(local_route.get("meters", 0.0))
        entur_m = float(entur_route.get("meters", 0.0))
        local_min = float(local_route.get("seconds", 0.0)) / 60
        entur_min = float(entur_route.get("seconds", 0.0)) / 60

        print(
            case["name"].ljust(28),
            f"{local_m:10.1f}",
            f"{entur_m:10.1f}",
            f"{_fmt_delta(local_m, entur_m):>10}",
            f"{local_min:12.1f}",
            f"{entur_min:12.1f}",
            f"{_fmt_delta(local_min, entur_min):>10}",
        )


if __name__ == "__main__":
    asyncio.run(main())
