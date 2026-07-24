from sqlalchemy import Column, Integer, String, DateTime
from sqlalchemy.sql import func
from app.core.database import Base


class Report(Base):
    """Informe al que se le puede etiquetar una Task (agrupación simple,
    mismo patrón que Client, sin relación con Account/Cuentas)."""
    __tablename__ = "reports"

    id = Column(Integer, primary_key=True)
    name = Column(String(120), unique=True, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
