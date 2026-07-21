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
    followed: bool = False


class TaskPersonaRow(BaseModel):
    account_id: int
    profile_name: str | None = None
    corporate_email: str | None = None
    status: str            # Account.status (activo/inactivo/suspendido/en_revision)
    device_id: int | None = None
    device_label: str | None = None   # alias del celular (o su nombre si no tiene alias); None sin celular
    boxphone: str | None = None
    platforms: list[TaskActionPlatform]   # SIEMPRE 3, orden: facebook, instagram, tiktok


class TaskDetail(BaseModel):
    """Detalle completo y editable de una tarea puntual (se usa tanto recién
    creada como al reabrir cualquier tarea de la lista)."""
    id: int
    link: str
    comment: str | None = None
    force_completed: bool = False
    created_at: datetime
    updated_at: datetime | None = None
    rows: list[TaskPersonaRow]   # TODOS los perfiles, lista plana sin agrupar por celular


class TaskHistoryItem(BaseModel):
    id: int
    order_number: int      # posición 1-indexada, fija desde la creación (por created_at asc)
    link: str
    comment: str | None = None
    created_at: datetime
    updated_at: datetime | None = None
    completed_count: int   # liked+shared+commented+followed=True en TODAS las redes activas (progreso REAL)
    total_count: int       # (redes activas de cada persona) * 4, sobre todas las personas
    force_completed: bool = False   # cierre manual: no altera completed_count/total_count
    display_percent: int   # 100 si force_completed, si no el % real (completed_count/total_count)
