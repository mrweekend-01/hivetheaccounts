from datetime import datetime
from pydantic import BaseModel
from app.core.enums import Platform


class HumanizationSocialIcon(BaseModel):
    platform: Platform
    social_account_id: int | None = None   # None si no hay credenciales
    state: str   # "sin_credenciales" | "pendiente" | "en_proceso" | "hecho"
    remaining_seconds: int = 0
    last_humanized_at: datetime | None = None   # sobrevive a los reinicios


class HumanizationPersona(BaseModel):
    account_id: int
    profile_name: str | None = None
    corporate_email: str | None = None
    traits: list[str] = []
    socials: list[HumanizationSocialIcon]   # SIEMPRE 3, orden: facebook, instagram, tiktok


class HumanizationGroup(BaseModel):
    device_id: int | None = None
    device_name: str
    personas: list[HumanizationPersona]


class HumanizationView(BaseModel):
    humanization_minutes: int
    all_done: bool   # true si TODOS los iconos con social_account_id != None están "hecho"
    groups: list[HumanizationGroup]
