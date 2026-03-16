import random

from app.models.group import Group
from app.models.equipment import Equipment
from app.database import SessionLocal
from sqlalchemy import select
from geoalchemy2.shape import from_shape
from shapely.geometry import Point


async def seed_groups():
    async with SessionLocal() as session:
        result = await session.execute(select(Group))
        if result.scalars().first():
            return

        groups = [
            Group(name="arrkom"),
            Group(name="turingen"),
            Group(name="prokom"),
            Group(name="bedkom"),
            Group(name="kjellerkom"),
            Group(name="vevkom"),
            Group(name="jentekom")
        ]

        session.add_all(groups)
        await session.commit()

async def seed_equipment():
    async with SessionLocal() as session:
        result = await session.execute(select(Equipment))
        if result.scalars().first():
            return

        arrkom_result = await session.execute(select(Group).where(Group.name == "arrkom"))
        arrkom = arrkom_result.scalar_one()

        turingen_result = await session.execute(select(Group).where(Group.name == "turingen"))
        turingen = turingen_result.scalar_one()

        equipment_data = [
            # arrkom
            ("Soundboks 4", "Speaker", "electronics", arrkom.id),

            # turingen
            ("Telt Fjellheimen Trek Camp", "4 person telt", "overnatting", turingen.id),
            ("Sovepose 3-sesong", "Mountain Equipment sovepose", "overnatting", turingen.id),
            ("Lakenpose", "Mountain Equipment lakenpose", "overnatting", turingen.id),
            ("Lavvo Helsport", "Lavvo for 10 personer", "overnatting", turingen.id),
            ("Hengekøye Original", "Standard hengekøye", "overnatting", turingen.id),
            ("Tau til hengekøye", "3.2 meter tau", "overnatting", turingen.id),
            ("Hengekøye Kingsize", "Stor hengekøye", "overnatting", turingen.id),
            ("Liggeunderlag tynt", "Enkelt liggeunderlag", "overnatting", turingen.id),
            ("Liggeunderlag tykt", "Oppblåsbart liggeunderlag", "overnatting", turingen.id),
            ("Jervenduk", "Beskyttelsesduk for tur", "overnatting", turingen.id),
            ("Tarp", "4.35m x 2.90m tarp", "overnatting", turingen.id),
            ("Storsekk", "65 liter sekk", "overnatting", turingen.id),

            ("Stormkjøkken lite", "Primus stormkjøkken lite", "kjøkken", turingen.id),
            ("Stormkjøkken stort", "Primus stormkjøkken stort", "kjøkken", turingen.id),

            ("Førstehjelpssett", "Førstehjelpsutstyr", "annet", turingen.id),
            ("Termos", "Termos for varm drikke", "annet", turingen.id),
            ("Tursag", "Sammenleggbar sag", "annet", turingen.id),
            ("Kartlomme", "Kartmappe A4", "annet", turingen.id),
            ("Kompass", "Navigasjonskompass", "annet", turingen.id),
            ("Hodelykt", "Hodelykt for tur", "annet", turingen.id),
            ("Liten kniv", "Turkniv", "annet", turingen.id),
            ("Machete", "Stor turkniv", "annet", turingen.id),

            ("Pil og bue", "Bue med piler og blink", "aktivitet", turingen.id),
            ("Fiskestang", "Fiskestang med snelle", "aktivitet", turingen.id),
            ("Sluker", "Diverse fiskesluker", "aktivitet", turingen.id),
            ("Slackline", "15 meter slackline", "aktivitet", turingen.id),
            ("Gummibåt", "Gummibåt med årer", "aktivitet", turingen.id),

            ("Discgolfsett", "6 typer frisbeer", "idrett", turingen.id),
            ("Crashpads", "Buldringsmatter", "idrett", turingen.id),
            ("Tennisracketer", "Tennisracketer og baller", "idrett", turingen.id),
            ("Padelracketer", "Padelracketer og baller", "idrett", turingen.id),
            ("Squashracketer", "Squashracketer og baller", "idrett", turingen.id),
            ("Spikeball", "Spikeball spill", "idrett", turingen.id),
            ("Kubb", "Kubb spill", "idrett", turingen.id),
        ]
        locations = [
            (10.413654, 63.432467),
            (10.403334, 63.418120),
            (10.377241, 63.426885),
            (10.348832, 63.422432)
        ]
        equipment = []

        for name, desc, type_eq, owner_id in equipment_data:
            lon, lat = random.choice(locations)

            equipment.append(
                Equipment(
                    name=name,
                    description=desc,
                    type_of_equipment=type_eq,
                    owner_id=owner_id,
                    current_pos=from_shape(Point(lon, lat), srid=4326)
                )
            )

        session.add_all(equipment)
        await session.commit()