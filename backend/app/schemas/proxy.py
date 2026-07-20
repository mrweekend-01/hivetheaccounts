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
    country_code: str | None = None  # ISO 3166-1 alpha-2, ej "US", "DE", "PE"


class ProxyCreate(ProxyBase):
    password: str | None = None  # texto plano de entrada, se cifra en el CRUD
    device_id: int | None = None  # celular al que queda asignado (opcional)


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
    country_code: str | None = None
    device_id: int | None = None


class ProxyOut(ProxyBase):
    """Salida sin credencial. `password` solo se entrega en detalle con reveal."""
    model_config = ConfigDict(from_attributes=True)
    id: int
    created_at: datetime | None = None


class ProxyReveal(ProxyOut):
    password: str | None = None  # descifrada
