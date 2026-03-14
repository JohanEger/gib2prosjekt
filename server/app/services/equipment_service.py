from sqlalchemy import select
from app.models.equipment import Equipment
from app.models.group import Group

async def equipment_for_sidebar(session, committee: list[str] | None):

    stmt = select(Equipment)

    if committee:
        stmt = (
            stmt.join(Equipment.owner)
            .where(Group.name.in_(committee))
        )

    result = await session.execute(stmt)
    return result.scalars().all()