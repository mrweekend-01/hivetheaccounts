from pydantic import BaseModel
from app.core.enums import HumanizationStatus, Platform


class HumanizationItem(BaseModel):
    """Una red social individual dentro del grupo de un celular."""
    social_account_id: int
    account_id: int
    platform: Platform
    profile_name: str | None = None
    corporate_email: str
    humanization_status: HumanizationStatus
    remaining_seconds: int  # 0 si pendiente o hecho


class HumanizationGroup(BaseModel):
    device_id: int | None = None
    device_name: str
    items: list[HumanizationItem]


class HumanizationView(BaseModel):
    humanization_minutes: int
    all_done: bool
    groups: list[HumanizationGroup]
