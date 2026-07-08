from datetime import datetime
from pydantic import BaseModel, ConfigDict
from app.core.enums import Role


class UserBase(BaseModel):
    username: str
    full_name: str | None = None
    role: Role = Role.operador
    is_active: bool = True


class UserCreate(UserBase):
    password: str


class UserUpdate(BaseModel):
    full_name: str | None = None
    role: Role | None = None
    is_active: bool | None = None
    password: str | None = None


class UserOut(UserBase):
    model_config = ConfigDict(from_attributes=True)
    id: int
    created_at: datetime | None = None
