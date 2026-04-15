import uuid

from app.models.booking import Booking
from app.models.user import User
from app.schemas.equipment import EquipmentFilter, NewEquipment
from sqlalchemy import select, and_, func, cast
from datetime import datetime
from app.models.equipment import Equipment
from app.models.group import Group
from geoalchemy2 import Geography, Geometry
from sqlalchemy.exc import IntegrityError



def build_equipment_query(committee: list[str] | None, euclidean_distance: float | None, type_of_equipment: str | None, available: bool | None, latitude: float | None, longitude: float | None):
    stmt = select(Equipment)

    if committee:
        stmt = (
            stmt.join(Equipment.owner)
            .where(Group.name.in_(committee))
        )
    if type_of_equipment:
        stmt = stmt.where(Equipment.type_of_equipment == type_of_equipment) 
    
    if available is not None:
        current_time = datetime.utcnow()
        active_bookings = select(Booking.id).where(
            and_(
                Booking.equipment_id == Equipment.id,
                Booking.start_time <= current_time,
                Booking.end_time >= current_time
            )
        ).exists()

        if available:
            stmt = stmt.where(~active_bookings)
        else:
            stmt = stmt.where(active_bookings)

    if euclidean_distance is not None and latitude is not None and longitude is not None:  
        reference_point = cast(func.ST_SetSRID(func.ST_MakePoint(longitude, latitude), 4326), Geography(geometry_type='POINT', srid=4326))
        stmt = stmt.where(func.ST_DWithin(Equipment.current_pos, reference_point, euclidean_distance))
    return stmt

async def equipment_for_sidebar(session, filter: EquipmentFilter):
    stmt = build_equipment_query(filter.committee, filter.euclidean_distance, filter.type_of_equipment, filter.available, filter.latitude, filter.longitude)

    stmt = stmt.with_only_columns(
    Equipment.id,
    Equipment.name,
    Equipment.description,
    Equipment.type_of_equipment,
    Equipment.owner_id,
    func.ST_Y(cast(Equipment.current_pos, Geometry(geometry_type="POINT", srid=4326))).label("lat"),
    func.ST_X(cast(Equipment.current_pos, Geometry(geometry_type="POINT", srid=4326))).label("lng"),
    )

    result = await session.execute(stmt)
    rows = result.all()

    return [
        {
            "id": row.id,
            "name": row.name,
            "description": row.description,
            "type_of_equipment": row.type_of_equipment,
            "owner_id": row.owner_id,
            "lat": row.lat,
            "lng": row.lng,
        }
        for row in rows
    ]

async def get_equipment_popup(session, equipment_id: uuid.UUID):
    stmt = select(
        Equipment.id,
        Equipment.name,
        Equipment.description,
        func.ST_Y(
            cast(Equipment.current_pos, Geometry(geometry_type="POINT", srid=4326))
        ).label("lat"),
        func.ST_X(
            cast(Equipment.current_pos, Geometry(geometry_type="POINT", srid=4326))
        ).label("lng"),
    ).where(Equipment.id == equipment_id)

    result = await session.execute(stmt)
    row = result.first()

    if not row:
        return None

    current_time = datetime.utcnow()

    booking_stmt = select(Booking.id).where(
        and_(
            Booking.equipment_id == equipment_id,
            Booking.start_time <= current_time,
            Booking.end_time >= current_time,
        )
    )

    booking_result = await session.execute(booking_stmt)

    booked = booking_result.first() is not None

    return {
        "id": row.id,
        "name": row.name,
        "description": row.description,
        "lat": row.lat,
        "lng": row.lng,
        "booked": booked,
    }

async def register_new_equipment(session, newEquipment: NewEquipment):
    stmt = select(Group.id).where(Group.name == newEquipment.committee)
    result = await session.execute(stmt)
    owner_id = result.scalar_one_or_none()
    equipment = Equipment(
        name = newEquipment.name,
        description = newEquipment.description,
        type_of_equipment = newEquipment.type,
        owner_id = owner_id,
         current_pos=func.ST_SetSRID(
        func.ST_MakePoint(newEquipment.longitude, newEquipment.latitude),
        4326
    )
    )
    try:
        session.add(equipment)
        await session.commit()
        await session.refresh(equipment)
    except IntegrityError:
        await session.rollback()
        raise Exception("ID-kollisjon (ekstremt sjeldent)")
    return equipment
