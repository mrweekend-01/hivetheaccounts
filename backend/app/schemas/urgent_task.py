from datetime import datetime
from pydantic import BaseModel, ConfigDict
from app.core.enums import UrgentPriority, UrgentStatus


class UrgentTaskCreate(BaseModel):
    title: str
    description: str | None = None
    priority: UrgentPriority = UrgentPriority.media
    assigned_to: int | None = None


class UrgentTaskUpdate(BaseModel):
    title: str | None = None
    description: str | None = None
    priority: UrgentPriority | None = None
    assigned_to: int | None = None
    status: UrgentStatus | None = None


class UrgentTaskStatusUpdate(BaseModel):
    status: UrgentStatus


class UrgentTaskOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    title: str
    description: str | None = None
    priority: UrgentPriority
    status: UrgentStatus
    assigned_to: int | None = None
    assignee_name: str | None = None   # nombre del admin asignado, para mostrar directo
    created_at: datetime | None = None
    finished_at: datetime | None = None
