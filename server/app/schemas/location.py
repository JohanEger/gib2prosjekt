from uuid import UUID
from pydantic import BaseModel
from app.models import group

class LocationFilter(BaseModel):
    group_id: UUID | None = None
    available: bool | None = None
    type_of_equipment: str | None = None
    euclidean_distance: float | None = None


class EquipmentMarker(BaseModel):
    id: UUID
    name: str
    lat: float
    lng: float

class EquopmentDetail(BaseModel):
    id: UUID
    name: str
    description: str | None
    type_of_equipment: str
    owner_id: UUID
    lat: float
    lng: float

