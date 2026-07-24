from datetime import datetime
from pydantic import BaseModel, ConfigDict


class ReportCreate(BaseModel):
    name: str


class ReportUpdate(BaseModel):
    name: str


class ReportOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    name: str
    created_at: datetime | None = None
