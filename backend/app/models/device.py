from sqlalchemy import Column, Integer, String, Text, DateTime, Enum as SAEnum
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.core.database import Base
from app.core.enums import Status


class Device(Base):
    """Celular físico. Puede tener varios proxies (1:N) y agrupa varias cuentas."""
    __tablename__ = "devices"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(80), unique=True, nullable=False)  # "CEL 1"
    nickname = Column(String(20))  # alias corto usado en reportes, ej "9KL"
    boxphone = Column(String(80))  # caja física del phone farm que agrupa este celular, ej "Boxphone 1"
    status = Column(SAEnum(Status, name="device_status"), default=Status.activo)
    notes = Column(Text)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    proxies = relationship("Proxy", back_populates="device")
    accounts = relationship("Account", back_populates="device")
