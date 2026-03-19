from fastapi import APIRouter, Depends, Query
from app.database import get_database
from app.services.equipment_service import equipment_for_sidebar
from app.schemas.equipment import EquipmentFilter, EquipmentSchema
from typing import List
from app.dependencies import get_current_user

router = APIRouter(prefix="/equipment", tags=["equipment"])

@router.get("/sidebar", response_model=list[EquipmentSchema])
async def get_sidebar_equipment(
    committee: List[str] | None = Query(None),
    euclidean_distance: float | None = Query(None),
    type_of_equipment: str | None = Query(None),
    available: bool | None = Query(None),
    session = Depends(get_database),
    current_user = Depends(get_current_user),
    latitude: float | None = Query(None),
    longitude: float | None = Query(None)
):
    filter = EquipmentFilter(
        committee=committee,
        euclidean_distance=euclidean_distance,
        type_of_equipment=type_of_equipment,
        available=available,
        latitude=latitude,
        longitude=longitude
    )
    return await equipment_for_sidebar(session, filter=filter)    
