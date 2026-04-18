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

WALK_SPEED_BY_HIGHWAY_KPH = {
    "footway": 5.6,
    "pedestrian": 5.6,
    "path": 5.1,
    "track": 4.8,
    "living_street": 5.1,
    "residential": 4.9,
    "unclassified": 4.7,
    "service": 4.3,
    "tertiary": 4.2,
    "secondary": 3.9,
    "primary": 3.5,
    "trunk": 3.0,
    "cycleway": 4.5,
    "steps": 1.8,
    "corridor": 4.5,
    "bridleway": 3.8,
    "elevator": 1.0,
    "via_ferrata": 1.0,
}

WALK_COST_FACTOR_BY_HIGHWAY = {
    "footway": 0.88,
    "pedestrian": 0.86,
    "path": 0.94,
    "track": 1.0,
    "living_street": 0.96,
    "residential": 1.0,
    "unclassified": 1.04,
    "service": 1.12,
    "tertiary": 1.1,
    "secondary": 1.18,
    "primary": 1.35,
    "trunk": 1.9,
    "cycleway": 1.12,
    "steps": 1.65,
    "corridor": 0.92,
    "bridleway": 1.2,
    "elevator": 1.15,
    "via_ferrata": 4.0,
}

WALK_FOOT_ALLOWED_VALUES = {"yes", "designated", "permissive", "official"}
WALK_FOOT_DISALLOWED_VALUES = {"no", "private"}
WALK_SIDEWALK_GOOD_VALUES = {"yes", "both", "left", "right", "separate"}
WALK_SIDEWALK_BAD_VALUES = {"no", "none"}
WALK_CROSSING_GOOD_VALUES = {"yes", "marked", "zebra", "traffic_signals", "uncontrolled"}

WALK_HIGHWAY_PRIORITY = (
    "steps",
    "footway",
    "pedestrian",
    "path",
    "track",
    "cycleway",
    "corridor",
    "living_street",
    "residential",
    "service",
    "unclassified",
    "tertiary",
    "secondary",
    "primary",
    "trunk",
    "bridleway",
    "elevator",
    "via_ferrata",
)

ROAD_WITH_SIDEWALK_IMPORTANCE = {"service", "residential", "unclassified", "tertiary", "secondary", "primary", "trunk"}


class RouteMode(str, Enum):
    walk = "walk"
    bike = "bike"
    drive = "drive"
    bus = "bus"


_graphs: dict[RouteMode, nx.MultiDiGraph] = {}
_graph_lock = threading.Lock()
GRAPH_ROUTE_MODES = (RouteMode.walk, RouteMode.bike, RouteMode.drive)


def _graph_path(mode: RouteMode) -> Path:
    return ROUTING_DIR / f"trondheim_{mode.value}.graphml"


def _load_base_graph(mode: RouteMode) -> nx.MultiDiGraph:
    path = _graph_path(mode)

    if path.exists():
        logger.info("Laster %s-graf fra %s", mode.value, path)
        return ox.load_graphml(path)

    logger.info(
        "Laster ned %s-graf (network_type=%r) fra OSM",
        mode.value,
        mode.value,
    )
    G = ox.graph_from_place(PLACE_QUERY, network_type=mode.value)
    path.parent.mkdir(parents=True, exist_ok=True)
    ox.save_graphml(G, path)
    return G


def _haversine_m(lat1: float, lng1: float, lat2: float, lng2: float) -> float:
    R = 6_371_000.0
    dlat = radians(lat2 - lat1)
    dlng = radians(lng2 - lng1)
    a = (
        sin(dlat / 2) ** 2
        + cos(radians(lat1)) * cos(radians(lat2)) * sin(dlng / 2) ** 2
    )
    return 2 * R * asin(sqrt(a))


def _seconds_for_speed(length_m: float, speed_kph: float) -> float:
    return length_m / (speed_kph * 1000 / 3600)


def _tag_values(data: dict, key: str) -> set[str]:
    value = data.get(key)
    if value is None:
        return set()
    if isinstance(value, list):
        return {str(v).lower() for v in value if v is not None}
    return {str(value).lower()}


def _edge_highways(data: dict) -> list[str]:
    highways = list(_tag_values(data, "highway"))
    if not highways:
        return []

    for preferred in WALK_HIGHWAY_PRIORITY:
        if preferred in highways:
            return [preferred]
    return highways


def _primary_walk_highway(data: dict) -> str | None:
    highways = _edge_highways(data)
    return highways[0] if highways else None


def _walk_speed_kph_for_edge(data: dict) -> float:
    highway = _primary_walk_highway(data)
    return WALK_SPEED_BY_HIGHWAY_KPH.get(highway or "", WALK_SPEED_KPH)


def _walk_cost_factor_for_edge(data: dict) -> float:
    highway = _primary_walk_highway(data)
    factor = WALK_COST_FACTOR_BY_HIGHWAY.get(highway or "", 1.0)

    foot_tags = _tag_values(data, "foot")
    sidewalk_tags = _tag_values(data, "sidewalk")
    crossing_tags = _tag_values(data, "crossing")
    segregated_tags = _tag_values(data, "segregated")
    bicycle_tags = _tag_values(data, "bicycle")

    if foot_tags & WALK_FOOT_ALLOWED_VALUES:
        factor *= 0.92
    if foot_tags & WALK_FOOT_DISALLOWED_VALUES:
        factor *= 2.5

    if highway in ROAD_WITH_SIDEWALK_IMPORTANCE:
        if sidewalk_tags & WALK_SIDEWALK_GOOD_VALUES:
            factor *= 0.9
        elif sidewalk_tags & WALK_SIDEWALK_BAD_VALUES:
            factor *= 1.12

    if crossing_tags & WALK_CROSSING_GOOD_VALUES:
        factor *= 0.9

    if "yes" in segregated_tags and highway == "cycleway":
        factor *= 0.96

    if highway in {"path", "track", "cycleway"} and bicycle_tags & {"designated", "official"}:
        factor *= 1.04

    return max(factor, 0.5)


def _add_walk_travel_times(G: nx.MultiDiGraph) -> nx.MultiDiGraph:
    for _, _, _, data in G.edges(keys=True, data=True):
        length_m = data.get("length", 0.0)
        speed_kph = _walk_speed_kph_for_edge(data)
        travel_time = _seconds_for_speed(length_m, speed_kph)
        data["travel_time"] = travel_time
        data["walk_cost"] = travel_time * _walk_cost_factor_for_edge(data)
    return G


def _is_cycleway_edge(highway: object) -> bool:
    if isinstance(highway, list):
        return "cycleway" in highway
    return highway == "cycleway"


def _can_walk_on_cycleway_edge(data: dict) -> bool:
    foot_tags = _tag_values(data, "foot")
    if foot_tags & WALK_FOOT_DISALLOWED_VALUES:
        return False
    return bool(foot_tags & WALK_FOOT_ALLOWED_VALUES)


def _merge_walk_with_bike_cycleways(
    walk_graph: nx.MultiDiGraph, bike_graph: nx.MultiDiGraph
) -> nx.MultiDiGraph:
    added_edges = 0

    for u, v, _, data in bike_graph.edges(keys=True, data=True):
        if not _is_cycleway_edge(data.get("highway")):
            continue
        if not _can_walk_on_cycleway_edge(data):
            continue

        if u not in walk_graph:
            walk_graph.add_node(u, **dict(bike_graph.nodes[u]))
        if v not in walk_graph:
            walk_graph.add_node(v, **dict(bike_graph.nodes[v]))

        walk_graph.add_edge(u, v, **dict(data))
        added_edges += 1

    logger.info("La til %s cycleway-kanter fra bike-grafen i walk-grafen", added_edges)
    return walk_graph


def _route_weight(mode: RouteMode) -> str:
    if mode is RouteMode.walk:
        return "walk_cost"
    if mode is RouteMode.drive:
        return "travel_time"
    return "length"


def load_graph(mode: RouteMode = RouteMode.walk) -> nx.MultiDiGraph:
    """Cacher én graf per reisemodus. Trådsikker lazy-load."""
    if mode is RouteMode.bus:
        raise ValueError("Bus-ruting bruker Entur og har ingen lokal OSM-graf")

    if mode in _graphs:
        return _graphs[mode]

    with _graph_lock:
        if mode in _graphs:
            return _graphs[mode]

        G = _load_base_graph(mode)

        # Berik grafene in-memory med tidskostnad for raskeste-rutevalg.
        if mode is RouteMode.walk:
            bike_graph = _graphs.get(RouteMode.bike) or _load_base_graph(RouteMode.bike)
            G = _merge_walk_with_bike_cycleways(G, bike_graph)
            G = _add_walk_travel_times(G)
        elif mode is RouteMode.drive:
            G = ox.routing.add_edge_speeds(G, fallback=DRIVE_FALLBACK_KPH)
            G = ox.routing.add_edge_travel_times(G)

        _graphs[mode] = G
        return G


def preload_all_graphs() -> None:
    """Kall ved app-oppstart (lifespan) for å unngå treg første request."""
    for mode in GRAPH_ROUTE_MODES:
        load_graph(mode)


def _pick_best_edge(edge_data: dict, weight: str) -> dict:
    """Velg parallell-kanten som best matcher vekten ruten ble beregnet med."""
    if weight == "length":
        return min(edge_data.values(), key=lambda d: d.get("length", float("inf")))
    if weight == "walk_cost":
        return min(
            edge_data.values(),
            key=lambda d: (
                d.get("walk_cost", float("inf")),
                d.get("travel_time", float("inf")),
                d.get("length", float("inf")),
            ),
        )
    return min(
        edge_data.values(),
        key=lambda d: (d.get(weight, float("inf")), d.get("length", float("inf"))),
    )


def _edge_coords(
    G: nx.MultiDiGraph, u: int, v: int, weight: str
) -> list[tuple[float, float]]:
    """
    Returner koordinater langs kanten u -> v som [(lng, lat), ...].
    Bruker edge.geometry (Shapely LineString) hvis den finnes — dette gir
    korrekt buede linjer for svingete veier. Faller tilbake til rett linje
    mellom node-endepunktene hvis geometri mangler.
    """
    edge_data = G.get_edge_data(u, v)
    if not edge_data:
        return []

    best = _pick_best_edge(edge_data, weight)
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
    G: nx.MultiDiGraph, route: list[int], weight: str
) -> list[list[float]]:
    """Bygg full rute-geometri ved å sy sammen edge-geometrier."""
    out: list[list[float]] = []
    for u, v in zip(route[:-1], route[1:]):
        edge_coords = _edge_coords(G, u, v, weight)
        if not edge_coords:
            continue
        # Unngå å duplisere overgangsnoden mellom påfølgende kanter.
        if out and out[-1][0] == edge_coords[0][0] and out[-1][1] == edge_coords[0][1]:
            edge_coords = edge_coords[1:]
        out.extend([list(c) for c in edge_coords])
    return out


def _route_stats(
    G: nx.MultiDiGraph, route: list[int], mode: RouteMode, weight: str
) -> tuple[float, float]:
    """Returner (meters, seconds) langs ruten."""
    total_m = 0.0
    total_s = 0.0

    for u, v in zip(route[:-1], route[1:]):
        edge_data = G.get_edge_data(u, v)
        if not edge_data:
            continue
        best = _pick_best_edge(edge_data, weight)
        length_m = best.get("length", 0.0)
        total_m += length_m

        if mode in (RouteMode.walk, RouteMode.drive):
            travel_time = best.get("travel_time")
            if travel_time is None:
                fallback_speed = (
                    DRIVE_FALLBACK_KPH if mode is RouteMode.drive else WALK_SPEED_KPH
                )
                travel_time = _seconds_for_speed(length_m, fallback_speed)
            total_s += travel_time

    if mode is RouteMode.bike:
        total_s = _seconds_for_speed(total_m, BIKE_SPEED_KPH)

    return total_m, total_s


def compute_shortest_path(
    start_lat: float,
    start_lng: float,
    end_lat: float,
    end_lng: float,
    mode: RouteMode = RouteMode.walk,
) -> dict:
    G = load_graph(mode)
    weight = _route_weight(mode)

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

    route = ox.routing.shortest_path(G, orig, dest, weight=weight)
    if route is None:
        raise nx.NetworkXNoPath(f"Ingen rute mellom {orig} og {dest}")

    coordinates = _route_to_coordinates(G, route, weight)
    meters, seconds = _route_stats(G, route, mode, weight)

    return {
        "type": "LineString",
        "coordinates": coordinates,
        "meters": meters,
        "seconds": seconds,
    }