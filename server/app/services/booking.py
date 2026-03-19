from sqlalchemy import select
from app.models.booking import Booking

async def check_Availability(session, id):
    result = await session.execute(
        select(Booking).where(Booking.id == id)
    )

    booking = result.scalars().first()

    return booking is None