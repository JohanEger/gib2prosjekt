from fastapi import APIRouter, Depends, HTTPException, status
from app.database import get_database
from app.dependencies import get_current_user
import app.models.equipment
from app.schemas.location import EquipmentMarker, LocationFilter
from app.services.location import get_locations
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

router = APIRouter(prefix="/locations", tags=["locations"])

@router.get("/", response_model=list[EquipmentMarker])
async def read_locations(db: AsyncSession = Depends(get_database), filter: LocationFilter = Depends(), current_user = Depends(get_current_user)):
    return await get_locations(db, filter, current_user)

