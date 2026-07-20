from sqlalchemy import (Column, Integer, String, Text, DateTime,
                        ForeignKey, Enum as SAEnum)
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.core.database import Base
from app.core.enums import ProxyStatus


class Proxy(Base):
    """Proxy comprado a un proveedor. Relación N:1 con un dispositivo (un
    celular puede tener varios proxies; cada proxy pertenece a lo sumo uno)."""
    __tablename__ = "proxies"

    id = Column(Integer, primary_key=True, index=True)
    label = Column(String(80))            # alias opcional, ej "Proxy-01"
    provider = Column(String(80))         # proveedor donde se compró
    ip = Column(String(45), nullable=False)   # soporta IPv6
    port = Column(Integer, nullable=False)
    username = Column(String(120))
    password_encrypted = Column(Text)     # cifrado Fernet
    protocol = Column(String(10), default="http")  # http / socks5
    status = Column(SAEnum(ProxyStatus, name="proxy_status"),
                    default=ProxyStatus.operativo, index=True)
    notes = Column(Text)
    country_code = Column(String(2), nullable=True)  # ISO 3166-1 alpha-2, ej "US", "DE", "PE"
    device_id = Column(Integer, ForeignKey("devices.id", ondelete="SET NULL"),
                       nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    device = relationship("Device", back_populates="proxies")
