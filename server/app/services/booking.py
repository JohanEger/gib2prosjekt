from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from app.models.booking import Booking
import uuid
from datetime import datetime
from app.models.booking import Booking

async def get_bookings_by_equipment(
    equipment_id: uuid.UUID,
    db: AsyncSession
):
    result = await db.execute(
        select(Booking).where(Booking.equipment_id == equipment_id)
    )
    
    bookings = result.scalars().all()
    return bookings

async def create_booking(
    db: AsyncSession,
    equipment_id: uuid.UUID,
    user_id: uuid.UUID,
    start_time: datetime,
    end_time: datetime,
    latitude: float,
    longitude: float,
    created_at: datetime
):
    booking = Booking(
        equipment_id=equipment_id,
        udser_id=user_id,
        start_time=start_time,
        end_time=end_time,
        latitude=latitude,
        longitude=longitude,
        created_at=created_at
    )
    db.add(booking)
    await db.commit()

    return booking