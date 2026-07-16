from pydantic import BaseModel


class HumanizationSettingsOut(BaseModel):
    humanization_minutes: int


class HumanizationSettingsUpdate(BaseModel):
    humanization_minutes: int
