from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from app.models.booking import Booking
import uuid
from datetime import datetime
from app.models.booking import Booking
from sqlalchemy import select, desc

async def get_bookings_by_equipment(
    equipment_id: uuid.UUID,
    db: AsyncSession
):
    result = await db.execute(
        select(Booking).where(Booking.equipment_id == equipment_id)
    )
    
    bookings = result.scalars().all()
    return bookings

async def get_5_last_bookings_by_equipment(
        equipment_id: uuid.UUID,
        db: AsyncSession
):
    result = await db.execute(
        select(Booking)
        .where(Booking.equipment_id == equipment_id)
        .order_by(desc(Booking.created_at))
        .limit(5)
    )
    return result.scalars().all()

from geoalchemy2.shape import from_shape
from shapely.geometry import Point

from datetime import datetime

async def create_booking(
    db: AsyncSession,
    equipment_id: uuid.UUID,
    user_id: uuid.UUID,
    start_time: datetime,
    end_time: datetime,
    latitude: float,
    longitude: float,
):
    point = from_shape(Point(longitude, latitude), srid=4326)

    booking = Booking(
        equipment_id=equipment_id,
        user_id=user_id,
        start_time=start_time,
        end_time=end_time,
        booking_destination=point,
        created_at=datetime.utcnow(), 
    )

    db.add(booking)
    await db.commit()
    await db.refresh(booking)

    return booking