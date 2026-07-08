from datetime import datetime
from pydantic import BaseModel, ConfigDict
from app.core.enums import ProxyStatus


class ProxyBase(BaseModel):
    label: str | None = None
    provider: str | None = None
    ip: str
    port: int
    username: str | None = None
    protocol: str = "http"
    status: ProxyStatus = ProxyStatus.operativo
    notes: str | None = None


class ProxyCreate(ProxyBase):
    password: str | None = None  # texto plano de entrada, se cifra en el CRUD


class ProxyUpdate(BaseModel):
    label: str | None = None
    provider: str | None = None
    ip: str | None = None
    port: int | None = None
    username: str | None = None
    password: str | None = None
    protocol: str | None = None
    status: ProxyStatus | None = None
    notes: str | None = None


class ProxyOut(ProxyBase):
    """Salida sin credencial. `password` solo se entrega en detalle con reveal."""
    model_config = ConfigDict(from_attributes=True)
    id: int
    created_at: datetime | None = None


class ProxyReveal(ProxyOut):
    password: str | None = None  # descifrada
