from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from app.models.booking import Booking
import uuid

async def get_bookings_by_equipment(
    equipment_id: uuid.UUID,
    db: AsyncSession
):
    result = await db.execute(
        select(Booking).where(Booking.equipment_id == equipment_id)
    )
    
    bookings = result.scalars().all()
    return bookings