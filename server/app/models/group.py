from sqlalchemy import String, Table, Column, ForeignKey
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.dialects.postgresql import UUID
import uuid
from sqlalchemy.orm import declarative_base

from app.database import Base

class Group(Base):
    __tablename__ = 'group'
    id = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name = mapped_column(String(50), unique=True, nullable=False,index=True)
    users : Mapped[list["User"]] = relationship("User", secondary="user_group", back_populates="groups")
    equipment : Mapped[list["Equipment"]] = relationship("Equipment", secondary="equipment_group", back_populates="bookable_by")
