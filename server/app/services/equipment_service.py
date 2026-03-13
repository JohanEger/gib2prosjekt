from sqlalchemy import select
from app.models.equipment import Equipment
from app.models.group import Group

async def equipment_for_sidebar(session, committee: str | None):

    if committee is None:
        result = await session.execute(select(Equipment))
    else:
        result = await session.execute(
            select(Equipment)
            .join(Equipment.owner)
            .where(Group.name == committee)
        )

    return result.scalars().all()