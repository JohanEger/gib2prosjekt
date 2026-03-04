from sqlalchemy import ARRAY, Column, Integer, String, Text, DateTime, Boolean, ForeignKey, Enum
from sqlalchemy.orm import Mapped, declarative_base, mapped_column
from sqlalchemy.orm import relationship
from sqlalchemy.dialects.postgresql import UUID
from datetime import datetime
import uuid
from geoalchemy2 import Geography

from app.database import Base

class Booking(Base):
    __tablename__ = 'booking'
    id : Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    equipment_id : Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey('equipment.id', ondelete='CASCADE'), nullable=False,index=True)
    user_id : Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey('user.id', ondelete='CASCADE'), nullable=False, index=True)
    start_time: Mapped[datetime] = mapped_column(DateTime, nullable=False)
    end_time: Mapped[datetime] = mapped_column(DateTime, nullable=False)
    booking_destination: Mapped[Geography] = mapped_column(Geography(geometry_type='POINT', srid=4326), nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    equipment : Mapped["Equipment"] = relationship("Equipment", back_populates="bookings")
    user: Mapped["User"] = relationship("User", back_populates="bookings")    

    