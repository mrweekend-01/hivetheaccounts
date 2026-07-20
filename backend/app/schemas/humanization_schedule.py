from pydantic import BaseModel
from app.core.enums import Platform


class ScheduleCreate(BaseModel):
    social_account_id: int
    time_of_day: str  # "HH:MM"
    days_of_week: list[int] | None = None  # 0-6, None = todos los días
    active: bool = True


class ScheduleUpdate(BaseModel):
    time_of_day: str | None = None
    days_of_week: list[int] | None = None
    active: bool | None = None


class ScheduleOut(BaseModel):
    id: int
    social_account_id: int
    profile_name: str | None = None   # para mostrar en la lista, join con Account
    platform: Platform
    time_of_day: str
    days_of_week: list[int] | None = None
    active: bool
