from fastapi import APIRouter, Depends
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from app.models.booking import Booking
from app.schemas.booking import BookingSchema
from app.database import get_database

router = APIRouter(prefix="/booking", tags=["booking"])

from geoalchemy2.shape import to_shape

from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from app.schemas.booking import BookingSchema
from app.database import get_database
from app.services.booking import get_bookings_by_equipment
from geoalchemy2.shape import to_shape
import uuid

router = APIRouter(prefix="/booking", tags=["booking"])


@router.get("/booking_for_equipment/{equipment_id}", response_model=list[BookingSchema])
async def get_bookings_for_equipment(
    equipment_id: uuid.UUID,
    session: AsyncSession = Depends(get_database),
):
    bookings = await get_bookings_by_equipment(equipment_id, session)

    return [
        BookingSchema(
            id=b.id,
            equipment_id=b.equipment_id,
            user_id=b.user_id,
            start_time=b.start_time,
            end_time=b.end_time,
            latitude=(p := to_shape(b.booking_destination)).y,
            longitude=p.x,
            created_at=b.created_at,
        )
        for b in bookings
    ]