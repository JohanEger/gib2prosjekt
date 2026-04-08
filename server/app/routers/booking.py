from fastapi import APIRouter, Depends
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from app.models.booking import Booking
from app.schemas.booking import BookingSchema
from app.database import get_database

router = APIRouter(prefix="/booking", tags=["booking"])

from geoalchemy2.shape import to_shape

@router.get("/", response_model=list[BookingSchema])
async def get_bookings(
    session: AsyncSession = Depends(get_database),
):
    result = await session.execute(select(Booking))
    bookings = result.scalars().all()

    return [
        {
            "id": b.id,
            "equipment_id": b.equipment_id,
            "user_id": b.user_id,
            "start_time": b.start_time,
            "end_time": b.end_time,
            "latitude": to_shape(b.booking_destination).y,   
            "longitude": to_shape(b.booking_destination).x, 
            "created_at": b.created_at,
        }
        for b in bookings
    ]