from sqlalchemy.ext import asyncio
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.ext.asyncio import AsyncEngine, create_async_engine, async_sessionmaker
import os
import time
import logging
from dotenv import load_dotenv

load_dotenv()
# Set up logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)
DATABASE_URL = os.getenv('DATABASE_URL')

# Create the SQLAlchemy engine
engine: AsyncEngine = create_async_engine(
    DATABASE_URL,
    pool_pre_ping=True,  # Enable pool pre-ping to check connections
    )  

SessionLocal = async_sessionmaker(engine, expire_on_commit=False)
Base = declarative_base()

async def get_database():
    """Yields a database session, ensuring proper cleanup."""
    async with SessionLocal() as session:
        try:
            yield session
        except Exception as e:
            logger.error(f"Database session error: {e}")
            await session.rollback()  # Rollback any pending transactions on error
            raise

async def wait_for_db(max_retries=5, delay=2) -> bool:
    """Waits for the database to be available before proceeding."""
    retries = 0
    while retries < max_retries:
        try:
            # Attempt to connect to the database
            async with engine.connect() as connection:
                await connection.exec_driver_sql("SELECT 1")  # Simple query to test connection
            logger.info("Database is available!")
            return True
        except Exception as e:
            logger.warning(f"Database not available yet (attempt {retries + 1}/{max_retries}): {e}")
            await asyncio.sleep(delay)
            retries += 1
    logger.error("Could not connect to the database after multiple attempts.")
    return False