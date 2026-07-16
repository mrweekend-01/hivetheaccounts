from sqlalchemy import Column, Integer
from app.core.database import Base


class AppSettings(Base):
    """Ajustes globales editables desde la app, en una sola fila fija (id=1)."""
    __tablename__ = "app_settings"

    id = Column(Integer, primary_key=True, default=1)
    humanization_minutes = Column(Integer, nullable=False, default=30)
