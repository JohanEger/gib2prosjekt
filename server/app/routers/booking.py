from fastapi import APIRouter, Depends, Query
from app.database import get_database
from app.models.booking import Booking
from app.services.booking import check_Availability
from uuid import UUID

router = APIRouter(prefix="/equipment", tags=["equipment"])

@router.get("/checkbooking", response_model=bool)
async def checkbooking(
    id: UUID,
    session = Depends(get_database)
):
    return await check_Availability(session, id)