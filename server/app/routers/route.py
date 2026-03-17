from fastapi import APIRouter
from app.routing.pipeline import compute_route

router = APIRouter(prefix="/route", tags=["route"])

@router.get("/route")
def get_route(
    start_lat: float,
    start_lng: float,
    end_lat: float,
    end_lng:float
):
    path = compute_route(start_lat, start_lng, end_lat, end_lng)
    return {"path": path}