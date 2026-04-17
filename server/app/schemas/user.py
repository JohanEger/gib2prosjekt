from pydantic import BaseModel
from uuid import UUID

class UserSchema(BaseModel):
    id: UUID
    username: str  # eller email hvis du bruker det

    class Config:
        from_attributes = True