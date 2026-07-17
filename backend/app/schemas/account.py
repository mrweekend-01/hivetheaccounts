from datetime import date, datetime
from pydantic import BaseModel, ConfigDict, EmailStr
from app.core.enums import Status, Platform, PresenceState
from app.schemas.social_account import SocialAccountCreate, SocialAccountReveal
from app.schemas.proxy import ProxyReveal


class SocialsPresence(BaseModel):
    facebook: PresenceState = PresenceState.no_existe
    instagram: PresenceState = PresenceState.no_existe
    tiktok: PresenceState = PresenceState.no_existe


class AccountListItem(BaseModel):
    """Fila de la tabla: sin credenciales, con semáforo de redes."""
    model_config = ConfigDict(from_attributes=True)
    id: int
    corporate_email: str | None = None
    profile_name: str | None = None
    status: Status
    device_id: int | None = None
    device_name: str | None = None
    device_nickname: str | None = None
    boxphone: str | None = None
    socials: SocialsPresence


class AccountCreate(BaseModel):
    profile_name: str                  # identificador principal, obligatorio
    corporate_email: EmailStr | None = None
    corp_password: str | None = None   # texto plano, se cifra
    status: Status = Status.activo
    notes: str | None = None
    device_id: int | None = None
    birth_date: date | None = None
    traits: list[str] = []
    socials: list[SocialAccountCreate] = []


class AccountUpdate(BaseModel):
    corporate_email: EmailStr | None = None
    corp_password: str | None = None
    status: Status | None = None
    notes: str | None = None
    device_id: int | None = None
    profile_name: str | None = None
    birth_date: date | None = None
    traits: list[str] | None = None
    # reemplaza el set de redes si se envía (None = no tocar)
    socials: list[SocialAccountCreate] | None = None


class AccountDetail(BaseModel):
    """Detalle para el modal. Con reveal=true trae credenciales descifradas."""
    model_config = ConfigDict(from_attributes=True)
    id: int
    corporate_email: str | None = None
    corp_password: str | None = None   # descifrada solo si reveal
    status: Status
    notes: str | None = None
    profile_name: str | None = None
    birth_date: date | None = None
    traits: list[str] = []
    device_id: int | None = None
    device_name: str | None = None
    boxphone: str | None = None        # heredado del device
    proxy: ProxyReveal | None = None   # proxy heredada del device
    socials: list[SocialAccountReveal] = []
    created_at: datetime | None = None
