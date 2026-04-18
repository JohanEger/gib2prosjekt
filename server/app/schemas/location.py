from uuid import UUID
from pydantic import BaseModel
from app.models import group


class EquipmentMarker(BaseModel):
    id: UUID
    name: str
    lat: float
    lng: float



