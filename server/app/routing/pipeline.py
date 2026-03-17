import os
import osmnx as ox
import networkx as nx

GRAPH_PATH = "app/routing/trondheim.graphml"

_graph = None

#cache graph så den ikke lastes per request
def load_graph():
    global _graph

    if _graph is not None:
        return _graph
    
    if os.path.exists(GRAPH_PATH):
        print("Laster graf fra fil...")
        _graph = ox.load_graphml(GRAPH_PATH)
    else: 
        print("Laster ned graf fra OSM...")
        _graph = ox.graph_from_place(
            "Trondheim, Norway",
            network_type="drive"
        )
        ox.save_graphml(_graph, GRAPH_PATH)
    return _graph

def compute_shortest_patH(start_lat, start_lng, end_lat, end_lng):
    G = load_graph()

    orig = ox.distance.nearest_nodes(G, start_lng, start_lat)
    dest = ox.distance.nearest_nodes(G, end_lng, end_lat)

    try:
        route = nx.astar_path(G, orig, dest)
    except nx.NetworkXNoPath:
        return None

    return {
        "type": "Linestring",
        "coordinates": [
            [G.nodes[node]["x"], [G.nodes[node]["y"]]] for node in route 
        ]
    }