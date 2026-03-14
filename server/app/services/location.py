from app.models.equipment import Equipment
from app.models.booking import Booking
from app.models.user import User
from app.schemas.location import EquipmentMarker, LocationFilter
from app.database import get_database
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, and_
from datetime import datetime
from geoalchemy2 import Geometry

async def get_locations(db: AsyncSession, filter: LocationFilter, current_user: User):
    stmt = select(
        Equipment.id, 
        Equipment.name,
        Equipment.type_of_equipment,
        Equipment.owner_id,
        func.ST_Y(Equipment.current_pos.cast(Geometry)).label("lat"),
        func.ST_X(Equipment.current_pos.cast(Geometry)).label("lng")
        )
        

    if filter.type_of_equipment is not None:
        stmt = stmt.where(Equipment.type_of_equipment == filter.type_of_equipment)

    if filter.group_id is not None:
        stmt = stmt.where(Equipment.owner_id == filter.group_id)
    

    if filter.available:
        current_time = datetime.utcnow()
        active_bookings = select(Booking.id).where(
            and_(
                Booking.equipment_id == Equipment.id,
                Booking.start_time <= current_time,
                Booking.end_time >= current_time
            )
        ).exists()

        stmt = stmt.where(~active_bookings)
    
    if filter.euclidean_distance is not None:
        user_location = select(User.current_location).where(User.id == current_user.id).scalar_subquery()
        stmt = stmt.where(func.ST_DWithin(Equipment.current_pos, user_location, filter.euclidean_distance))
    
    result = await db.execute(stmt)
    rows = result.all()
    return [
        EquipmentMarker(
            id = row.id,
            name = row.name,
            type_of_equipment=row.type_of_equipment,
            lat = row.lat,
            lng = row.lng
        )
        for row in rows 
    ]
            
            
def is_available(equipment, current_time):
    for booking in equipment.bookings:
        if booking.start_time <= current_time <= booking.end_time:
            return False
    return True