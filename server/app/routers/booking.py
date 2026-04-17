from fastapi import APIRouter, Depends
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from app.models.booking import Booking
from app.schemas.booking import BookingSchema
from app.database import get_database
from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from app.schemas.booking import BookingSchema, BookingCreate
from app.database import get_database
from app.services.booking import get_bookings_by_equipment,create_booking
from geoalchemy2.shape import to_shape, from_shape
from shapely.geometry import Point
import uuid
from datetime import datetime
from app.services.booking import get_5_last_bookings_by_equipment


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

from shapely.geometry import Point

@router.get("/log/{equipment_id}")
async def get_5_latest_booking_for_equipment(
    equipment_id: uuid.UUID,
    session: AsyncSession = Depends(get_database),
):
    bookings = await get_5_last_bookings_by_equipment(equipment_id, session)

    result = []
    now = datetime.now()

    for b in bookings:
        if b.start_time >= now:
            continue
        try:
            p = to_shape(b.booking_destination)
            result.append({
                "lat": p.y,
                "lng": p.x,
                "started_at": b.start_time, 
            })
        except Exception:
            continue

    return result


def to_naive(dt: datetime) -> datetime:
    if dt.tzinfo is not None:
        return dt.replace(tzinfo=None)
    return dt

@router.post("/create_booking", response_model=BookingSchema)
async def create_booking_endpoint(
    booking: BookingCreate,
    db: AsyncSession = Depends(get_database),
):
    point = from_shape(Point(booking.longitude, booking.latitude), srid=4326)

    new_booking = Booking(
        equipment_id=booking.equipment_id,
        user_id=booking.user_id,
        start_time=to_naive(booking.start_time),
        end_time=to_naive(booking.end_time),
        booking_destination=point,
        created_at=datetime.utcnow(),
    )

    db.add(new_booking)
    await db.commit()
    await db.refresh(new_booking)

    # convert geometry → lat/lng
    p = to_shape(new_booking.booking_destination)

    return BookingSchema(
        id=new_booking.id,
        equipment_id=new_booking.equipment_id,
        user_id=new_booking.user_id,
        start_time=new_booking.start_time,
        end_time=new_booking.end_time,
        latitude=p.y,
        longitude=p.x,
        created_at=new_booking.created_at,
    )