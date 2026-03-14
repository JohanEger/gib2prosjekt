from fastapi import FastAPI, Depends, HTTPException
from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession
import logging
from starlette.middleware.cors import CORSMiddleware
from app.seeds.seed_data import seed_groups, seed_equipment
from .database import get_database, wait_for_db, engine, Base
from .routers.auth import router as auth_router
from app.routers import equipment

app = FastAPI()
app.include_router(auth_router)

origins = [
    "http://localhost",
    "http://localhost:80",
    "http://localhost:81",
    "http://localhost:5173",
    "http://localhost:5174",
    "http://127.0.0.1",
    "http://127.0.0.1:80",
    "http://127.0.0.1:81",
    "http://tba4250s02.it.ntnu.no"
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.on_event("startup")
async def startup():
    ok = await wait_for_db()
    if not ok:
        raise Exception("Database not available")

    # Create tables if they don’t exist
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)

@app.get("/health")
async def health(db: AsyncSession = Depends(get_database)):
    try:
        await db.execute(text("SELECT 1"))
        return {"status": "ok", "database": "connected"}
    except Exception:
        # 503 = Service Unavailable (tjenesten kjører, men avhengighet feiler)
        raise HTTPException(status_code=503, detail="Database connection failed")
    
@app.on_event("startup")
async def startup():
    ok = await wait_for_db()
    if not ok:
        raise Exception("Database not available")

    # Create tables
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)

    # Seed data
    await seed_groups()
    await seed_equipment()

app.include_router(https://github.com/JohanEger/gib2prosjekt/pull/39/conflict?name=client%252Fsrc%252Fpages%252FRegisterPage.tsx&ancestor_oid=7924661403929bcd7551d8535c311a0e7d54f426&base_oid=730ccd5a95db54f7a5a4da1d067677d82b893a3c&head_oid=de4bb047cf0279b0bb130467f278f304bbf2722eequipment.router)

import os

DATABASE_URL = os.getenv("DATABASE_URL")

print("DATABASE_URL:", DATABASE_URL)