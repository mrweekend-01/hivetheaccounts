from sqlalchemy import (Column, Integer, String, Text, DateTime,
                        ForeignKey, Enum as SAEnum)
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.core.database import Base
from app.core.enums import Status


class Device(Base):
    """Celular físico. Cada uno tiene UN proxy único (1:1) y agrupa varias cuentas."""
    __tablename__ = "devices"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(80), unique=True, nullable=False)  # "CEL 1"
    nickname = Column(String(20))  # alias corto usado en reportes, ej "9KL"
    # unique=True fuerza 1:1 -> un proxy no puede repetirse entre celulares
    proxy_id = Column(Integer, ForeignKey("proxies.id", ondelete="SET NULL"),
                      unique=True)
    status = Column(SAEnum(Status, name="device_status"), default=Status.activo)
    notes = Column(Text)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    proxy = relationship("Proxy", back_populates="device")
    accounts = relationship("Account", back_populates="device")
