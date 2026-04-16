from pydantic import BaseModel
import uuid

class EquipmentSchema(BaseModel):
    id: uuid.UUID
    name: str
    description: str | None
    type_of_equipment: str
    owner_id: uuid.UUID
    lat: float
    lng: float

    class Config:
        from_attributes = True

class  EquipmentFilter(BaseModel):
    committee: list[str] | None = None
    euclidean_distance: float | None = None
    type_of_equipment: str | None = None
    available: bool | None = None
    latitude: float | None = None
    longitude: float | None = None  

class NewEquipment(BaseModel):
    name: str
    description: str
    committee: str
    type: str
    latitude: float
    longitude: float

from pydantic import BaseModel
from uuid import UUID

class EquipmentResponse(BaseModel):
    id: UUID
    name: str
    description: str

    class Config:
        from_attributes = True  # viktig!
