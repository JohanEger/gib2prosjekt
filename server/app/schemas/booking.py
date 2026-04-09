from pydantic import BaseModel
from datetime import datetime
import uuid

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