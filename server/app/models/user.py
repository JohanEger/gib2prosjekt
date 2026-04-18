from sqlalchemy import Column, Integer, String, Text, DateTime, Boolean, ForeignKey, Enum
from sqlalchemy.orm import Mapped, declarative_base, mapped_column
from sqlalchemy.orm import relationship
from sqlalchemy.dialects.postgresql import ARRAY, UUID
from datetime import datetime
import uuid
from app.database import Base


class User(Base):
    __tablename__ = 'user'
    
    id = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    username = mapped_column(String(50), unique=True, nullable=False,index=True)
    email = mapped_column(String(120), unique=True, nullable=False,index=True)
    phone_number = mapped_column(String(10), nullable=False)
    password_hash = mapped_column(String(128), nullable=False)
    is_admin = mapped_column(Boolean, default=False)
    groups : Mapped[list["Group"]] = relationship("Group", secondary="user_group", back_populates="users")
    created_at = mapped_column(DateTime, default=datetime.utcnow)
    bookings : Mapped[list["Booking"]] = relationship("Booking", back_populates="user", cascade="all, delete-orphan")
