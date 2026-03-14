from pydantic import BaseModel
import uuid

class EquipmentSchema(BaseModel):
    id: uuid.UUID
    name: str
    description: str | None
    type_of_equipment: str

    class Config:
        from_attributes = True