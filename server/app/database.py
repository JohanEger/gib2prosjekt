from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
import os
import time
import logging

# Set up logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)
DATABASE_URL = os.getenv('DATABASE_URL')

# Create the SQLAlchemy engine
engine = create_engine(
    DATABASE_URL,
    pool_size = 5,
    max_overflow = 10,
    pool_pre_ping = True,   # Validate connections before using them
    echo = True     #Set to False in production for better performance
    )

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

def get_database():
    """Yields a database session, ensuring proper cleanup."""
    db = SessionLocal()
    try:
        yield db
    except Exception as e:
        logger.error(f"Database session error: {e}")
        db.rollback()  # Rollback any pending transactions on error
        raise
    finally:
        db.close()

def wait_for_db(max_retries=5, delay=5):
    """Waits for the database to be available before proceeding."""
    retries = 0
    while retries < max_retries:
        try:
            # Attempt to connect to the database
            connection = engine.connect()
            connection.close()
            logger.info("Database is available!")
            return True
        except Exception as e:
            logger.warning(f"Database not available yet (attempt {retries + 1}/{max_retries}): {e}")
            time.sleep(delay)
            retries += 1
    logger.error("Could not connect to the database after multiple attempts.")
    return False


