from sqlalchemy import Table, Column, ForeignKey
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.dialects.postgresql import UUID
from app.database import Base

user_group = Table(
    'user_group',
    Base.metadata,
    Column('user_id', UUID(as_uuid=True), ForeignKey('user.id', ondelete='CASCADE'), primary_key=True),
    Column('group_id', UUID(as_uuid=True), ForeignKey('group.id', ondelete='CASCADE'), primary_key=True)
)

equipment_group = Table(
    'equipment_group',
    Base.metadata,
    Column('equipment_id', UUID(as_uuid=True), ForeignKey('equipment.id', ondelete='CASCADE'), primary_key=True),
    Column('group_id', UUID(as_uuid=True), ForeignKey('group.id', ondelete='CASCADE'), primary_key=True)
)