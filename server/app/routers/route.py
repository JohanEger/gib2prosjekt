from fastapi import APIRouter
from app.routing.pipeline import compute_shortest_path

router = APIRouter(prefix="/route", tags=["route"])

@router.get("/")
def get_route(
    start_lat: float,
    start_lng: float,
    end_lat: float,
    end_lng: float
):
    try:
        path = compute_shortest_path(start_lat, start_lng, end_lat, end_lng)

        if path is None:
            return {"type": "LineString", "coordinates": [], "meters": None}

        return path

    except Exception as e:
        return {
            "error": str(e),
            "type": str(type(e))
        }