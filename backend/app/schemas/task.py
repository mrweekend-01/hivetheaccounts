from datetime import datetime
from pydantic import BaseModel
from app.core.enums import Platform


class TaskActionPlatform(BaseModel):
    platform: Platform
    social_account_id: int | None = None   # None si el perfil no tiene esa red activa
    active: bool                           # false = gris/deshabilitado (sin credenciales)
    liked: bool = False
    shared: bool = False
    commented: bool = False


class TaskPersonaRow(BaseModel):
    account_id: int
    profile_name: str | None = None
    corporate_email: str
    device_label: str | None = None   # alias del celular (o su nombre si no tiene alias); None sin celular
    platforms: list[TaskActionPlatform]   # SIEMPRE 3, orden: facebook, instagram, tiktok


class TaskDetail(BaseModel):
    """Detalle completo y editable de una tarea puntual (se usa tanto recién
    creada como al reabrir cualquier tarea de la lista)."""
    id: int
    link: str
    created_at: datetime
    updated_at: datetime | None = None
    rows: list[TaskPersonaRow]   # TODOS los perfiles, lista plana sin agrupar por celular


class TaskHistoryItem(BaseModel):
    id: int
    link: str
    created_at: datetime
    updated_at: datetime | None = None
    completed_count: int   # liked+shared+commented=True en TODAS las redes activas
    total_count: int       # (redes activas de cada persona) * 3, sobre todas las personas
