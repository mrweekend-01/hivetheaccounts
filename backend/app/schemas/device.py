from datetime import datetime
from pydantic import BaseModel, ConfigDict
from app.core.enums import Status
from app.schemas.proxy import ProxyOut


class DeviceBase(BaseModel):
    name: str
    nickname: str | None = None
    boxphone: str | None = None
    status: Status = Status.activo
    notes: str | None = None


class DeviceCreate(DeviceBase):
    proxy_id: int | None = None


class DeviceUpdate(BaseModel):
    name: str | None = None
    nickname: str | None = None
    boxphone: str | None = None
    status: Status | None = None
    notes: str | None = None
    proxy_id: int | None = None


class DeviceOut(DeviceBase):
    model_config = ConfigDict(from_attributes=True)
    id: int
    proxy: ProxyOut | None = None
    account_count: int = 0
    created_at: datetime | None = None
