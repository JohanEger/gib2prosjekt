from sqlalchemy import select
from app.models.equipment import Equipment
from app.models.group import Group
from fastapi import HTTPException
from uuid import UUID

async def equipment_for_sidebar(session, committee: list[str] | None):

    stmt = select(Equipment)

    if committee:
        stmt = (
            stmt.join(Equipment.owner)
            .where(Group.name.in_(committee))
        )
    result = await session.execute(stmt)
    return result.scalars().all()

async def equipment_for_popup(session, id: str):
    print(f"Looking for equipment with id: {id!r}")
    result = await session.execute(
        select(Equipment).where(Equipment.id == UUID(id))
    )
    equipment = result.scalars().first()
    print(f"Found: {equipment}")  # 👈
    if not equipment:
        raise HTTPException(status_code=404, detail="Equipment not found")
    return equipment