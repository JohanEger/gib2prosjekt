from sqlalchemy import select, join
from sqlalchemy.ext.asyncio import AsyncSession
from app.models.booking import Booking
import uuid
from datetime import datetime
from app.models.booking import Booking
from app.models.user import User
from datetime import timedelta


async def get_bookings_by_equipment(
    equipment_id: uuid.UUID,
    db: AsyncSession
):
    result = await db.execute(
        select(Booking).where(Booking.equipment_id == equipment_id)
    )
    
    bookings = result.scalars().all()
    return bookings

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

async def get_booking_for_date(
    db: AsyncSession,
    equipment_id: uuid.UUID,
    date: str
):
    date = datetime.fromisoformat(date.replace("Z", "+00:00"))

    if date.tzinfo is not None:
        date = date.replace(tzinfo=None)

    start_of_day = date.replace(hour=0, minute=0, second=0, microsecond=0)
    end_of_day = start_of_day + timedelta(days=1)

    result = await db.execute(
        select(Booking)
        .where(
            Booking.equipment_id == equipment_id,
            Booking.start_time < end_of_day,
            Booking.end_time >= start_of_day
        )
    )

    booking = result.scalars().first()

    if not booking:
        return None

    return {
        "id": str(booking.id),
        "start_time": booking.start_time,
        "end_time": booking.end_time,
        "user_id": str(booking.user_id),
    }