from app.models.group import Group
from app.models.equipment import Equipment
from app.database import SessionLocal
from sqlalchemy import select
from geoalchemy2.shape import from_shape
from shapely.geometry import Point


async def seed_groups():
    async with SessionLocal() as session:
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
        arrkom_result = await session.execute(select(Group).where(Group.name == "arrkom"))
        arrkom = arrkom_result.scalar_one()
        turingen_result = await session.execute(select(Group).where(Group.name == "turingen"))
        turingen = turingen_result.scalar_one()
       
        equipment = [
        #arrkom
        Equipment(name = "Soundboks 4", description= "Speaker", owner = arrkom,type_of_equipment="electronics", current_pos = from_shape(Point(10.403334, 63.418120), srid=4236)),
        
        #turingen
        Equipment(name="Telt Fjellheimen Trek Camp", description="4 person telt", type_of_equipment="overnatting", owner_id=turingen.id, current_pos=from_shape(Point(10.403334, 63.418120), srid=4326)),
        Equipment(name="Sovepose 3-sesong", description="Mountain Equipment sovepose", type_of_equipment="overnatting", owner_id=turingen.id, current_pos=from_shape(Point(10.403334, 63.418120), srid=4326)),
        Equipment(name="Lakenpose", description="Mountain Equipment lakenpose", type_of_equipment="overnatting", owner_id=turingen.id, current_pos=from_shape(Point(10.403334, 63.418120), srid=4326)),
        Equipment(name="Lavvo Helsport", description="Lavvo for 10 personer", type_of_equipment="overnatting", owner_id=turingen.id, current_pos=from_shape(Point(10.403334, 63.418120), srid=4326)),
        Equipment(name="Hengekøye Original", description="Standard hengekøye", type_of_equipment="overnatting", owner_id=turingen.id, current_pos=from_shape(Point(10.403334, 63.418120), srid=4326)),
        Equipment(name="Tau til hengekøye", description="3.2 meter tau", type_of_equipment="overnatting", owner_id=turingen.id, current_pos=from_shape(Point(10.403334, 63.418120), srid=4326)),
        Equipment(name="Hengekøye Kingsize", description="Stor hengekøye", type_of_equipment="overnatting", owner_id=turingen.id, current_pos=from_shape(Point(10.403334, 63.418120), srid=4326)),
        Equipment(name="Liggeunderlag tynt", description="Enkelt liggeunderlag", type_of_equipment="overnatting", owner_id=turingen.id, current_pos=from_shape(Point(10.403334, 63.418120), srid=4326)),
        Equipment(name="Liggeunderlag tykt", description="Oppblåsbart liggeunderlag", type_of_equipment="overnatting", owner_id=turingen.id, current_pos=from_shape(Point(10.403334, 63.418120), srid=4326)),
        Equipment(name="Jervenduk", description="Beskyttelsesduk for tur", type_of_equipment="overnatting", owner_id=turingen.id, current_pos=from_shape(Point(10.403334, 63.418120), srid=4326)),
        Equipment(name="Tarp", description="4.35m x 2.90m tarp", type_of_equipment="overnatting", owner_id=turingen.id, current_pos=from_shape(Point(10.403334, 63.418120), srid=4326)),
        Equipment(name="Storsekk", description="65 liter sekk", type_of_equipment="overnatting", owner_id=turingen.id, current_pos=from_shape(Point(10.403334, 63.418120), srid=4326)),
        Equipment(name="Stormkjøkken lite", description="Primus stormkjøkken lite", type_of_equipment="kjøkken", owner_id=turingen.id, current_pos=from_shape(Point(10.403334, 63.418120), srid=4326)),
        Equipment(name="Stormkjøkken stort", description="Primus stormkjøkken stort", type_of_equipment="kjøkken", owner_id=turingen.id, current_pos=from_shape(Point(10.403334, 63.418120), srid=4326)),
        Equipment(name="Førstehjelpssett", description="Førstehjelpsutstyr", type_of_equipment="annet", owner_id=turingen.id, current_pos=from_shape(Point(10.403334, 63.418120), srid=4326)),
        Equipment(name="Termos", description="Termos for varm drikke", type_of_equipment="annet", owner_id=turingen.id, current_pos=from_shape(Point(10.403334, 63.418120), srid=4326)),
        Equipment(name="Tursag", description="Sammenleggbar sag", type_of_equipment="annet", owner_id=turingen.id, current_pos=from_shape(Point(10.403334, 63.418120), srid=4326)),
        Equipment(name="Kartlomme", description="Kartmappe A4", type_of_equipment="annet", owner_id=turingen.id, current_pos=from_shape(Point(10.403334, 63.418120), srid=4326)),
        Equipment(name="Kompass", description="Navigasjonskompass", type_of_equipment="annet", owner_id=turingen.id, current_pos=from_shape(Point(10.403334, 63.418120), srid=4326)),
        Equipment(name="Hodelykt", description="Hodelykt for tur", type_of_equipment="annet", owner_id=turingen.id, current_pos=from_shape(Point(10.403334, 63.418120), srid=4326)),
        Equipment(name="Liten kniv", description="Turkniv", type_of_equipment="annet", owner_id=turingen.id, current_pos=from_shape(Point(10.403334, 63.418120), srid=4326)),
        Equipment(name="Machete", description="Stor turkniv", type_of_equipment="annet", owner_id=turingen.id, current_pos=from_shape(Point(10.403334, 63.418120), srid=4326)),
        Equipment(name="Pil og bue", description="Bue med piler og blink", type_of_equipment="aktivitet", owner_id=turingen.id, current_pos=from_shape(Point(10.403334, 63.418120), srid=4326)),
        Equipment(name="Fiskestang", description="Fiskestang med snelle", type_of_equipment="aktivitet", owner_id=turingen.id, current_pos=from_shape(Point(10.403334, 63.418120), srid=4326)),
        Equipment(name="Sluker", description="Diverse fiskesluker", type_of_equipment="aktivitet", owner_id=turingen.id, current_pos=from_shape(Point(10.403334, 63.418120), srid=4326)),
        Equipment(name="Slackline", description="15 meter slackline", type_of_equipment="aktivitet", owner_id=turingen.id, current_pos=from_shape(Point(10.403334, 63.418120), srid=4326)),
        Equipment(name="Gummibåt", description="Gummibåt med årer", type_of_equipment="aktivitet", owner_id=turingen.id, current_pos=from_shape(Point(10.403334, 63.418120), srid=4326)),
        Equipment(name="Discgolfsett", description="6 typer frisbeer", type_of_equipment="idrett", owner_id=turingen.id, current_pos=from_shape(Point(10.403334, 63.418120), srid=4326)),
        Equipment(name="Crashpads", description="Buldringsmatter", type_of_equipment="idrett", owner_id=turingen.id, current_pos=from_shape(Point(10.403334, 63.418120), srid=4326)),
        Equipment(name="Tennisracketer", description="Tennisracketer og baller", type_of_equipment="idrett", owner_id=turingen.id, current_pos=from_shape(Point(10.403334, 63.418120), srid=4326)),
        Equipment(name="Padelracketer", description="Padelracketer og baller", type_of_equipment="idrett", owner_id=turingen.id, current_pos=from_shape(Point(10.403334, 63.418120), srid=4326)),
        Equipment(name="Squashracketer", description="Squashracketer og baller", type_of_equipment="idrett", owner_id=turingen.id, current_pos=from_shape(Point(10.403334, 63.418120), srid=4326)),
        Equipment(name="Spikeball", description="Spikeball spill", type_of_equipment="idrett", owner_id=turingen.id, current_pos=from_shape(Point(10.403334, 63.418120), srid=4326)),
        Equipment(name="Kubb", description="Kubb spill", type_of_equipment="idrett", owner_id=turingen.id, current_pos=from_shape(Point(10.403334, 63.418120), srid=4326)),
        ]
        session.add_all(equipment)
        await session.commit()