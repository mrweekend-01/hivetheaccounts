from datetime import datetime
from pydantic import BaseModel, ConfigDict
from app.core.enums import Platform, Status, HumanizationStatus


class SocialAccountBase(BaseModel):
    platform: Platform
    username: str | None = None   # None = pendiente de credenciales
    slot_number: int | None = None
    profile_url: str | None = None
    status: Status = Status.activo
    notes: str | None = None


class SocialAccountCreate(SocialAccountBase):
    password: str | None = None       # texto plano, se cifra en el CRUD


class SocialAccountReveal(SocialAccountBase):
    model_config = ConfigDict(from_attributes=True)
    id: int
    password: str | None = None            # descifrada
    humanization_status: HumanizationStatus
