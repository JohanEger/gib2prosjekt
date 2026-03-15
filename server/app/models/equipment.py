from sqlalchemy import ARRAY, Column, Integer, String, Text, DateTime, Boolean, ForeignKey, Enum
from sqlalchemy.orm import Mapped, declarative_base, mapped_column
from sqlalchemy.orm import relationship
from sqlalchemy.dialects.postgresql import UUID
from datetime import datetime
import uuid
from geoalchemy2 import Geography

from app.database import Base


class Equipment(Base):
    __tablename__ = 'equipment'
    id = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name = mapped_column(String(100), nullable=False,index=True)
    description = mapped_column(Text, nullable=True)
    type_of_equipment = mapped_column(String(50), nullable=False)
    owner_id : Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("group.id"), nullable=False) 
    bookable_by : Mapped[list["Group"]] = relationship("Group", secondary="equipment_group", back_populates="equipment")
    current_pos = mapped_column(Geography(geometry_type='POINT', srid=4326), nullable=False)
    created_at = mapped_column(DateTime, default=datetime.utcnow)
    bookings : Mapped[list["Booking"]] = relationship("Booking", back_populates="equipment", cascade="all, delete-orphan")
    owner: Mapped["Group"] = relationship("Group", backref="owned_equipment", foreign_keys=[owner_id])
