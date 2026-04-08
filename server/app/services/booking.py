from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from app.models.booking import Booking

async def get_bookings(db: AsyncSession):
    result = await db.execute(
        select(Booking)
    )
    
    bookings = result.scalars().all()
    return bookings