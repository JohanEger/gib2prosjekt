import logging
import os
from contextlib import asynccontextmanager

from fastapi import Depends, FastAPI, HTTPException
from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession
from starlette.middleware.cors import CORSMiddleware

from app.routers import booking, equipment, location, route
from app.routers.auth import router as auth_router
from app.routing.pipeline import preload_all_graphs
from app.seeds.seed_data import (
    seed_Bookings,
    seed_equipment,
    seed_groups,
    seed_users,
)

from .database import Base, engine, get_database, wait_for_db

logger = logging.getLogger(__name__)

DATABASE_URL = os.getenv("DATABASE_URL")
print("DATABASE_URL:", DATABASE_URL)


@asynccontextmanager
async def lifespan(app: FastAPI):
    # --- Database ---
    ok = await wait_for_db()
    if not ok:
        raise RuntimeError("Database not available")

    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)

    await seed_groups()
    await seed_users()
    await seed_equipment()
    await seed_Bookings()

    # --- Rutegrafer (OSMnx) ---
    # Last alle grafer ved oppstart slik at første request ikke må vente på
    # nedlasting/parsing. Kjøres i threadpool siden OSMnx er synkron.
    import anyio
    try:
        await anyio.to_thread.run_sync(preload_all_graphs)
        logger.info("Rutegrafer lastet inn")
    except Exception:
        logger.exception("Kunne ikke preloade rutegrafer — fortsetter likevel")

    yield
    # (ingen shutdown-logikk nødvendig)


app = FastAPI(lifespan=lifespan)

origins = [
    "http://localhost",
    "http://localhost:80",
    "http://localhost:81",
    "http://localhost:5173",
    "http://localhost:5174",
    "http://127.0.0.1",
    "http://127.0.0.1:80",
    "http://127.0.0.1:81",
    "http://tba4250s02.it.ntnu.no",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth_router)
app.include_router(location.router)
app.include_router(equipment.router)
app.include_router(route.router)
app.include_router(booking.router)


@app.get("/health")
async def health(db: AsyncSession = Depends(get_database)):
    try:
        await db.execute(text("SELECT 1"))
        return {"status": "ok", "database": "connected"}
    except Exception:
        raise HTTPException(status_code=503, detail="Database connection failed")