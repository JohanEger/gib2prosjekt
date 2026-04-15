from fastapi import APIRouter, Depends, Query, HTTPException
from app.database import get_database
from app.services.equipment_service import equipment_for_sidebar, get_equipment_popup, register_new_equipment
from app.schemas.equipment import EquipmentFilter, EquipmentSchema, NewEquipment
from typing import List
from app.dependencies import get_current_user
from uuid import UUID


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

@router.get("/{equipment_id}")
async def get_equipment_popup_route(
    equipment_id: UUID,
    session = Depends(get_database),
    current_user = Depends(get_current_user)
):
    equipment = await get_equipment_popup(session, equipment_id)

    if not equipment:
        raise HTTPException(status_code=404, detail="Equipment not found")

    return equipment   

from app.schemas.equipment import EquipmentResponse

@router.post("/register_equipment", response_model=EquipmentResponse)
async def create_equipment(
    new_equipment: NewEquipment,
    session = Depends(get_database),
):
    equipment = await register_new_equipment(session, new_equipment)
    return equipment