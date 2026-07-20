from sqlalchemy import (Column, Integer, String, Time, Boolean, DateTime,
                        ForeignKey)
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.core.database import Base


class HumanizationSchedule(Base):
    """Horario recurrente que el scheduler en segundo plano usa para disparar
    el inicio automático de una humanización (ver app/scheduler.py)."""
    __tablename__ = "humanization_schedules"

    id = Column(Integer, primary_key=True)
    social_account_id = Column(Integer, ForeignKey("social_accounts.id", ondelete="CASCADE"),
                               nullable=False, index=True)
    time_of_day = Column(Time, nullable=False)  # hora del día, ej. 14:30
    days_of_week = Column(String(20), nullable=True)  # "0,1,2,3,4,5,6" (0=lunes), null = todos los días
    active = Column(Boolean, default=True, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    social_account = relationship("SocialAccount")
