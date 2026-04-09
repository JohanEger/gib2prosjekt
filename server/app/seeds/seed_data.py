import random

from app.models.group import Group
from app.models.equipment import Equipment
from app.models.booking import Booking
from app.database import SessionLocal
from sqlalchemy import select
from geoalchemy2.shape import from_shape
from shapely.geometry import Point
from datetime import datetime, timedelta
import uuid
from app.models.user import User



from app.models.user import User
import uuid

async def seed_users():
    async with SessionLocal() as session:
        result = await session.execute(select(User))
        if result.scalars().first():
            return

        users = [
            User(
                username="test1",
                email="test1@test.no",
                password_hash="...",
                is_admin=False,
            ),
            User(
                username="test2",
                email="test2@test.no",
                password_hash="...",
                is_admin=False,
            ),
        ]

        session.add_all(users)
        await session.commit()
        

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
            (10.348832, 63.422432),
            (10.394386, 63.395751),
        ]
        equipment = []

        for name, desc, type_eq, owner_id in equipment_data:
            if owner_id == arrkom.id:
                lon, lat = locations[4]  # Arrkom's equipment is always at the same location
            else:
                lon, lat = random.choice(locations[0:4])

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

async def seed_Bookings():
    async with SessionLocal() as session:
        today = datetime.utcnow()


        days_until_saturday = (5 - today.weekday()) % 7
        if days_until_saturday == 0:
            days_until_saturday = 7

        end_date = today + timedelta(days=days_until_saturday)

    
        result = await session.execute(select(User))
        user = result.scalars().first()

        if not user:
            raise Exception("Ingen brukere i databasen")

        user_id = user.id

        point = from_shape(Point(10.3951, 63.4305), srid=4326)

        result = await session.execute(
            select(Equipment.id).where(Equipment.name == "Soundboks 4")
        )

        Soundboks_id = result.scalar_one_or_none()

        booking = Booking(
            equipment_id=Soundboks_id,
            user_id=user_id,
            start_time=today,
            end_time=end_date,
            booking_destination=point,
        )
        session.add(booking)
        await session.commit()