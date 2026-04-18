from pydantic import BaseModel
from datetime import datetime
import uuid
from app.schemas.user import UserSchema
class BookingSchema(BaseModel):
    id: uuid.UUID
    equipment_id: uuid.UUID
    user_id: uuid.UUID
    start_time: datetime
    end_time: datetime
    latitude: float
    longitude: float
    created_at: datetime

    class Config:
        from_attributes = True

class BookingCreate(BaseModel):
    equipment_id: uuid.UUID
    user_id: uuid.UUID
    start_time: datetime
    end_time: datetime
    latitude: float
    longitude: float

class BookingWithUser(BaseModel):
    id: uuid.UUID
    start_time: datetime
    end_time: datetime
    user: UserSchema

    class Config:
        from_attributes = True
