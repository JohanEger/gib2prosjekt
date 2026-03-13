from fastapi import APIRouter, Depends, Query
from app.database import get_database
from app.services.equipment_service import equipment_for_sidebar

router = APIRouter(prefix="/equipment", tags=["equipment"])

@router.get("/sidebar")
async def get_sidebar_equipment(
    committee: str | None = Query(None),
    session = Depends(get_database)
):
    return await equipment_for_sidebar(session, committee)
