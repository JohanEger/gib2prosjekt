from fastapi import APIRouter, Depends, Query
from app.database import get_database
from app.services.equipment_service import equipment_for_sidebar
from app.schemas.equipment import EquipmentSchema
from typing import List

router = APIRouter(prefix="/equipment", tags=["equipment"])

@router.get("/sidebar", response_model=list[EquipmentSchema])
async def get_sidebar_equipment(
    committee: List[str] | None = Query(None),
    session = Depends(get_database)
):
    return await equipment_for_sidebar(session, committee)