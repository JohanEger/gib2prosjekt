import logging

import networkx as nx
from fastapi import APIRouter, HTTPException

from app.routing.pipeline import RouteMode, compute_shortest_path

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/route", tags=["route"])


@router.get("/")
def get_route(
    start_lat: float,
    start_lng: float,
    end_lat: float,
    end_lng: float,
    mode: RouteMode = RouteMode.walk,
):
    # Valider koordinat-rekkevidde tidlig.
    if not (-90 <= start_lat <= 90 and -90 <= end_lat <= 90):
        raise HTTPException(422, "Ugyldig breddegrad")
    if not (-180 <= start_lng <= 180 and -180 <= end_lng <= 180):
        raise HTTPException(422, "Ugyldig lengdegrad")

    try:
        return compute_shortest_path(
            start_lat, start_lng, end_lat, end_lng, mode=mode
        )
    except nx.NetworkXNoPath:
        raise HTTPException(404, "Ingen rute funnet mellom punktene")
    except ValueError as e:
        raise HTTPException(422, str(e))
    except Exception:
        logger.exception("Uventet feil i ruteberegning")
        raise HTTPException(500, "Intern feil ved ruteberegning")