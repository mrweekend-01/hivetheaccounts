from sqlalchemy import (Column, Integer, Boolean, DateTime,
                        ForeignKey, UniqueConstraint)
from sqlalchemy.sql import func
from app.core.database import Base


class TaskAction(Base):
    """Qué hizo (o no) un perfil (SocialAccount) en una Task dada: like,
    compartido, comentario, follow. Una fila por (task_id, social_account_id)."""
    __tablename__ = "task_actions"

    id = Column(Integer, primary_key=True, index=True)
    task_id = Column(Integer, ForeignKey("tasks.id", ondelete="CASCADE"),
                     nullable=False)
    social_account_id = Column(Integer,
                               ForeignKey("social_accounts.id", ondelete="CASCADE"),
                               nullable=False)
    liked = Column(Boolean, default=False, nullable=False)
    shared = Column(Boolean, default=False, nullable=False)
    commented = Column(Boolean, default=False, nullable=False)
    followed = Column(Boolean, default=False, nullable=False)
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    __table_args__ = (
        UniqueConstraint("task_id", "social_account_id", name="uq_task_social_account"),
    )
