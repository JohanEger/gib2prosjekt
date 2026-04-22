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
                phone_number = "12345678",
                password_hash="...",
                is_admin=False,
            ),
            User(
                username="test2",
                email="test2@test.no",
                phone_number = "32412141",
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
        lon, lat = 10.403334, 63.418120
        equipment = []
        for name, desc, type_eq, owner_id in equipment_data:

            equipment.append(
                Equipment(
                    name=name,
                    description=desc,
                    type_of_equipment=type_eq,
                    owner_id=owner_id,
                    home_pos=from_shape(Point(lon, lat), srid=4326)
                )
            )

        session.add_all(equipment)
        await session.commit()

async def seed_bookings():
    async with SessionLocal() as session:
        result = await session.execute(select(Booking))
        if result.scalars().first():
            return

        result = await session.execute(select(User))
        user = result.scalars().first()
        if not user:
            raise Exception("Ingen brukere i databasen")

        result = await session.execute(
            select(Equipment).where(Equipment.name == "Soundboks 4")
        )
        soundboks = result.scalar_one_or_none()
        if not soundboks:
            raise Exception("Soundboks 4 ikke funnet")

        # 5 tidligere bookinger på ulike lokasjoner rundt Trondheim
        past_bookings = [
            {
                "start": datetime.utcnow() - timedelta(days=30),
                "end": datetime.utcnow() - timedelta(days=29),
                "lon": 10.3919647, "lat": 63.4305132,  
            },
            {
                "start": datetime.utcnow() - timedelta(days=20),
                "end": datetime.utcnow() - timedelta(days=19),
                "lon": 10.3606876, "lat": 63.3999616,
            },
            {
                "start": datetime.utcnow() - timedelta(days=14),
                "end": datetime.utcnow() - timedelta(days=13),
                "lon": 10.4000233, "lat": 63.4061684,  
            },
            {
                "start": datetime.utcnow() - timedelta(days=7),
                "end": datetime.utcnow() - timedelta(days=6),
                "lon": 10.4196534, "lat": 63.4075094, 
            },
            {
                "start": datetime.utcnow() - timedelta(days=2),
                "end": datetime.utcnow() - timedelta(days=1),
                "lon": 10.4110457, "lat": 63.430932, 
            },
        ]

        bookings = [
            Booking(
                equipment_id=soundboks.id,
                user_id=user.id,
                start_time=b["start"],
                end_time=b["end"],
                booking_destination=from_shape(Point(b["lon"], b["lat"]), srid=4326),
            )
            for b in past_bookings
        ]

        session.add_all(bookings)
        await session.commit()

"""
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
        """