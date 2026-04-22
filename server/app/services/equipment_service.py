import uuid

from app.models.booking import Booking
from app.models.user import User
from app.schemas.equipment import EquipmentFilter, NewEquipment
from sqlalchemy import select, and_, func, cast
from datetime import datetime, timezone
from app.models.equipment import Equipment
from app.models.group import Group
from geoalchemy2 import Geography, Geometry
from sqlalchemy.exc import IntegrityError



def current_location_expr():
    current_time = datetime.now()

    active_booking_location = (
        select(Booking.booking_destination)
        .where(
            and_(
                Booking.equipment_id == Equipment.id,
                Booking.start_time <= current_time,
                Booking.end_time >= current_time,
            )
        )
        .limit(1)
        .scalar_subquery()
    )

    return cast(func.coalesce(active_booking_location, Equipment.home_pos), Geography(geometry_type="POINT",srid=4326))

def build_equipment_query(committee: list[str] | None, euclidean_distance: float | None, type_of_equipment: str | None, available: bool | None, latitude: float | None, longitude: float | None):
    stmt = select(Equipment)

    if committee:
        stmt = (
            stmt.join(Equipment.owner)
            .where(func.lower(Group.name).in_([func.lower(c) for c in committee]))
        )
    if type_of_equipment:
        stmt = stmt.where(func.lower(Equipment.type_of_equipment) == func.lower(type_of_equipment))

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
        
        location_expr = current_location_expr()

        stmt = stmt.where(func.ST_DWithin(location_expr, reference_point, euclidean_distance))
    return stmt

async def equipment_for_sidebar(session, filter: EquipmentFilter):
    location_expr = current_location_expr()

    location_geom = cast(location_expr, Geometry(geometry_type = "POINT",srid=4326))

    stmt = build_equipment_query(filter.committee, filter.euclidean_distance, filter.type_of_equipment, filter.available, filter.latitude, filter.longitude)

    stmt = stmt.with_only_columns(
    Equipment.id,
    Equipment.name,
    Equipment.description,
    Equipment.type_of_equipment,
    Equipment.owner_id,
    func.ST_Y(location_geom).label("lat"),
    func.ST_X(location_geom).label("lng"),
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
    location_expr = current_location_expr()

    location_geom = cast(
        location_expr,
        Geometry(geometry_type="POINT", srid=4326),
    )

    stmt = select(
        Equipment.id,
        Equipment.name,
        Equipment.description,
        Equipment.functional_status,
        Equipment.functional_status_comment,
        func.ST_Y(location_geom).label("lat"),
        func.ST_X(location_geom).label("lng"),
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
        "functional_status": row.functional_status.value,
        "functional_status_comment": row.functional_status_comment,
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
        home_pos=func.ST_SetSRID(
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
async def update_equipment_status(
    session,
    equipment_id: uuid.UUID,
    functional_status,
    functional_status_comment: str | None,
):
    equipment = await session.get(Equipment, equipment_id)

    if not equipment:
        return None

    equipment.functional_status = functional_status
    equipment.functional_status_comment = functional_status_comment

    await session.commit()
    await session.refresh(equipment)

    return {
        "id": equipment.id,
        "name": equipment.name,
        "functional_status": equipment.functional_status.value,
        "functional_status_comment": equipment.functional_status_comment,
    }

async def get_all_committees(session):
    result = await session.execute(select(Group.name).order_by(Group.name))
    return [row[0] for row in result.all()]