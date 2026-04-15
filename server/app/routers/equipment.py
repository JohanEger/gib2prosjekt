from fastapi import APIRouter, Depends, Query, HTTPException
from app.database import get_database
from app.services.equipment_service import equipment_for_sidebar, get_equipment_popup, update_equipment_status
from app.schemas.equipment import EquipmentFilter, EquipmentSchema
from typing import List
from app.dependencies import get_current_user
from uuid import UUID
from pydantic import BaseModel
from app.models.enums import FunctionalStatus
from app.models.equipment import Equipment


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

class EquipmentStatusUpdate(BaseModel):
    functional_status: FunctionalStatus
    functional_status_comment: str | None = None

@router.patch("/{equipment_id}/functional_status")
async def patch_equipment_status(
    equipment_id: UUID,
    payload: EquipmentStatusUpdate,
    session=Depends(get_database),
    current_user=Depends(get_current_user),
):
    updated_equipment = await update_equipment_status(
        session=session,
        equipment_id=equipment_id,
        functional_status=payload.functional_status,
        functional_status_comment=payload.functional_status_comment,
    )

    if not updated_equipment:
        raise HTTPException(status_code=404, detail="Equipment not found")

    return updated_equipment

