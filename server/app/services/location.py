from app.models.equipment import Equipment
from app.schemas.location import EquipmentMarker
from app.schemas.equipment import EquipmentFilter
from app.database import get_database
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, and_, cast
from datetime import datetime
from geoalchemy2 import Geometry
from .equipment_service import build_equipment_query

async def get_locations(db: AsyncSession, filter: EquipmentFilter):
    print("get_locations called with:", filter)
    stmt = build_equipment_query(
        committee=filter.committee,
        euclidean_distance=filter.euclidean_distance,
        type_of_equipment=filter.type_of_equipment,
        available=filter.available,
        latitude=filter.latitude,
        longitude=filter.longitude
    )


    stmt = stmt.with_only_columns(
        Equipment.id,
        Equipment.name,
        func.ST_Y(cast(Equipment.current_pos, Geometry(geometry_type="POINT", srid=4326))).label("lat"),
        func.ST_X(cast(Equipment.current_pos, Geometry(geometry_type="POINT", srid=4326))).label("lng"),
    )
    try:
        result = await db.execute(stmt)
        rows = result.all()
    except Exception as e:
        print("QUERY ERROR:", repr(e))
        raise
    return [
        EquipmentMarker(
            id = row.id,
            name = row.name,
            lat = row.lat,
            lng = row.lng
        )
        for row in rows 
    ]