from sqlalchemy import (Column, Integer, String, Text, DateTime,
                        ForeignKey, Enum as SAEnum)
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.core.database import Base
from app.core.enums import UrgentPriority, UrgentStatus


class UrgentTask(Base):
    """Tarjeta del tablero kanban "Urgent Task", visible solo para admins."""
    __tablename__ = "urgent_tasks"

    id = Column(Integer, primary_key=True)
    title = Column(String(200), nullable=False)
    description = Column(Text, nullable=True)
    priority = Column(SAEnum(UrgentPriority, name="urgent_priority"),
                      default=UrgentPriority.media, nullable=False)
    status = Column(SAEnum(UrgentStatus, name="urgent_status"),
                    default=UrgentStatus.no_arrancada, nullable=False)
    assigned_to = Column(Integer, ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    created_by = Column(Integer, ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    finished_at = Column(DateTime(timezone=True), nullable=True)

    assignee = relationship("User", foreign_keys=[assigned_to])
