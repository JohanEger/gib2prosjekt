from fastapi import APIRouter, Depends, HTTPException, status, Query
from app.database import get_database
from app.dependencies import get_current_user
import app.models.equipment
from app.schemas.location import EquipmentMarker
from app.services.location import get_locations
from app.schemas.equipment import EquipmentFilter
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from typing import List

router = APIRouter(prefix="/locations", tags=["locations"])

@router.get("/", response_model=list[EquipmentMarker])
async def read_locations(committee: List[str] | None = Query(None),
    euclidean_distance: float | None = Query(None),
    type_of_equipment: str | None = Query(None),
    available: bool | None = Query(None),
    session = Depends(get_database),
    current_user = Depends(get_current_user),
    latitude: float | None = Query(None),
    longitude: float | None = Query(None)):
    filter = EquipmentFilter(
        committee=committee,
        euclidean_distance=euclidean_distance,
        type_of_equipment=type_of_equipment,
        available=available,
        latitude=latitude,
        longitude=longitude
    )
    return await get_locations(session, filter)

