from fastapi import FastAPI, Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.orm import Session
from sqlalchemy import text
from pydantic import BaseModel, EmailStr
from passlib.context import CryptContext
from jose import JWTError, jwt
from datetime import datetime, timedelta
import logging
from starlette.middleware.cors import CORSMiddleware

from server.app.database import get_database, wait_for_database, engine
from server.app.models import Base, User, Task, Priority, Status

app = FastAPI()

origins = [
    "http://localhost",
    "http://localhost:80",
    "http://localhost:81",
     "http://localhost:5173",
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
def startup():
    if not wait_for_database():
        raise Exception("Database not available")

    # Create tables if they don’t exist
    Base.metadata.create_all(bind=engine)


@app.get("/health")
def health(db: Session = Depends(get_database)):
    try:
        db.execute(text("SELECT 1"))
        return {"status": "ok", "database": "connected"}
    except Exception as e:
        raise HTTPException(status_code=503, detail="Database connection failed")
