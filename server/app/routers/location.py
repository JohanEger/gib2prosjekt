from fastapi import APIRouter, Depends, HTTPException, status
from server.app.database import get_database
from server.app.dependencies import get_current_user
import server.app.models.equipment
from server.app.schemas.location import EquipmentMarker, LocationFilter
from server.app.services.location import get_locations
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

router = APIRouter(prefix="/locations", tags=["locations"])

@router.get("/", response_model=list[EquipmentMarker])
async def read_locations(db: AsyncSession = Depends(get_database), filter: LocationFilter = Depends(), current_user = Depends(get_current_user)):
    return await get_locations(db, filter, current_user)

