import logging
import threading
from enum import Enum
from math import asin, cos, radians, sin, sqrt
from pathlib import Path

import networkx as nx
import osmnx as ox

logger = logging.getLogger(__name__)

ROUTING_DIR = Path(__file__).parent
PLACE_QUERY = "Trondheim, Norway"

# Maks avstand (meter) mellom input-punkt og nærmeste node i grafen.
MAX_SNAP_DISTANCE_M = 500.0

# Faste hastigheter for gåing og sykling (km/t). Kjøring bruker OSM maxspeed.
WALK_SPEED_KPH = 5.0
BIKE_SPEED_KPH = 15.0
DRIVE_FALLBACK_KPH = 30.0  # brukes kun hvis en kant mangler speed_kph


class RouteMode(str, Enum):
    walk = "walk"
    bike = "bike"
    drive = "drive"


_graphs: dict[RouteMode, nx.MultiDiGraph] = {}
_graph_lock = threading.Lock()


def _graph_path(mode: RouteMode) -> Path:
    return ROUTING_DIR / f"trondheim_{mode.value}.graphml"


def _haversine_m(lat1: float, lng1: float, lat2: float, lng2: float) -> float:
    R = 6_371_000.0
    dlat = radians(lat2 - lat1)
    dlng = radians(lng2 - lng1)
    a = (
        sin(dlat / 2) ** 2
        + cos(radians(lat1)) * cos(radians(lat2)) * sin(dlng / 2) ** 2
    )
    return 2 * R * asin(sqrt(a))


def load_graph(mode: RouteMode = RouteMode.walk) -> nx.MultiDiGraph:
    """Cacher én graf per reisemodus. Trådsikker lazy-load."""
    if mode in _graphs:
        return _graphs[mode]

    with _graph_lock:
        if mode in _graphs:
            return _graphs[mode]

        path = _graph_path(mode)

        if path.exists():
            logger.info("Laster %s-graf fra %s", mode.value, path)
            G = ox.load_graphml(path)
        else:
            logger.info(
                "Laster ned %s-graf (network_type=%r) fra OSM",
                mode.value,
                mode.value,
            )
            G = ox.graph_from_place(PLACE_QUERY, network_type=mode.value)
            path.parent.mkdir(parents=True, exist_ok=True)
            ox.save_graphml(G, path)

        # Berik drive-grafen med hastigheter og reisetider fra OSM maxspeed.
        # Dette er in-memory og påvirker ikke lagret .graphml-fil.
        if mode is RouteMode.drive:
            G = ox.routing.add_edge_speeds(G, fallback=DRIVE_FALLBACK_KPH)
            G = ox.routing.add_edge_travel_times(G)

        _graphs[mode] = G
        return G


def preload_all_graphs() -> None:
    """Kall ved app-oppstart (lifespan) for å unngå treg første request."""
    for mode in RouteMode:
        load_graph(mode)


def _pick_shortest_edge(edge_data: dict) -> dict:
    """Velg den korteste parallell-kanten mellom to noder i MultiDiGraph."""
    return min(edge_data.values(), key=lambda d: d.get("length", float("inf")))


def _edge_coords(G: nx.MultiDiGraph, u: int, v: int) -> list[tuple[float, float]]:
    """
    Returner koordinater langs kanten u -> v som [(lng, lat), ...].
    Bruker edge.geometry (Shapely LineString) hvis den finnes — dette gir
    korrekt buede linjer for svingete veier. Faller tilbake til rett linje
    mellom node-endepunktene hvis geometri mangler.
    """
    edge_data = G.get_edge_data(u, v)
    if not edge_data:
        return []

    best = _pick_shortest_edge(edge_data)
    u_x, u_y = G.nodes[u]["x"], G.nodes[u]["y"]
    v_x, v_y = G.nodes[v]["x"], G.nodes[v]["y"]

    geom = best.get("geometry")
    if geom is None:
        return [(u_x, u_y), (v_x, v_y)]

    coords = list(geom.coords)  # shapely LineString -> list of (x, y)

    # OSM-geometrier er ikke garantert orientert u -> v. Snu hvis første
    # punkt er nærmere v enn u.
    fx, fy = coords[0]
    d_to_u = (fx - u_x) ** 2 + (fy - u_y) ** 2
    d_to_v = (fx - v_x) ** 2 + (fy - v_y) ** 2
    if d_to_v < d_to_u:
        coords.reverse()

    return coords


def _route_to_coordinates(
    G: nx.MultiDiGraph, route: list[int]
) -> list[list[float]]:
    """Bygg full rute-geometri ved å sy sammen edge-geometrier."""
    out: list[list[float]] = []
    for u, v in zip(route[:-1], route[1:]):
        edge_coords = _edge_coords(G, u, v)
        if not edge_coords:
            continue
        # Unngå å duplisere overgangsnoden mellom påfølgende kanter.
        if out and out[-1][0] == edge_coords[0][0] and out[-1][1] == edge_coords[0][1]:
            edge_coords = edge_coords[1:]
        out.extend([list(c) for c in edge_coords])
    return out


def _route_stats(
    G: nx.MultiDiGraph, route: list[int], mode: RouteMode
) -> tuple[float, float]:
    """Returner (meters, seconds) langs ruten."""
    total_m = 0.0
    total_s = 0.0

    for u, v in zip(route[:-1], route[1:]):
        edge_data = G.get_edge_data(u, v)
        if not edge_data:
            continue
        best = _pick_shortest_edge(edge_data)
        length_m = best.get("length", 0.0)
        total_m += length_m

        if mode is RouteMode.drive:
            # Bruk OSM-basert travel_time der tilgjengelig, ellers fallback.
            travel_time = best.get("travel_time")
            if travel_time is None:
                travel_time = length_m / (DRIVE_FALLBACK_KPH * 1000 / 3600)
            total_s += travel_time
        # walk/bike regnes ut etter løkka basert på total lengde

    if mode is RouteMode.walk:
        total_s = total_m / (WALK_SPEED_KPH * 1000 / 3600)
    elif mode is RouteMode.bike:
        total_s = total_m / (BIKE_SPEED_KPH * 1000 / 3600)

    return total_m, total_s


def compute_shortest_path(
    start_lat: float,
    start_lng: float,
    end_lat: float,
    end_lng: float,
    mode: RouteMode = RouteMode.walk,
) -> dict:
    G = load_graph(mode)

    orig = ox.distance.nearest_nodes(G, X=start_lng, Y=start_lat)
    dest = ox.distance.nearest_nodes(G, X=end_lng, Y=end_lat)

    orig_snap = _haversine_m(
        start_lat, start_lng, G.nodes[orig]["y"], G.nodes[orig]["x"]
    )
    dest_snap = _haversine_m(
        end_lat, end_lng, G.nodes[dest]["y"], G.nodes[dest]["x"]
    )
    if orig_snap > MAX_SNAP_DISTANCE_M:
        raise ValueError(
            f"Startpunkt er {orig_snap:.0f} m fra nærmeste vei — utenfor rutegrafen."
        )
    if dest_snap > MAX_SNAP_DISTANCE_M:
        raise ValueError(
            f"Destinasjon er {dest_snap:.0f} m fra nærmeste vei — utenfor rutegrafen."
        )

    if orig == dest:
        return {
            "type": "LineString",
            "coordinates": [],
            "meters": 0.0,
            "seconds": 0.0,
        }

    route = ox.routing.shortest_path(G, orig, dest, weight="length")
    if route is None:
        raise nx.NetworkXNoPath(f"Ingen rute mellom {orig} og {dest}")

    coordinates = _route_to_coordinates(G, route)
    meters, seconds = _route_stats(G, route, mode)

    return {
        "type": "LineString",
        "coordinates": coordinates,
        "meters": meters,
        "seconds": seconds,
    }