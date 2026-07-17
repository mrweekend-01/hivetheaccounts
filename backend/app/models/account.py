from sqlalchemy import (Column, Integer, String, Text, Date, DateTime,
                        ForeignKey, Enum as SAEnum, JSON)
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.core.database import Base
from app.core.enums import Status


class Account(Base):
    """Representa a la PERSONA/perfil: identificada por su profile_name (el
    correo de respaldo es opcional). El login real de cada red social vive
    en SocialAccount (a veces es un teléfono, a veces otro correo distinto)."""
    __tablename__ = "accounts"

    id = Column(Integer, primary_key=True, index=True)
    # opcional: no todas las personas tienen (o necesitan) un correo de respaldo
    corporate_email = Column(String(150), unique=True, nullable=True, index=True)
    corp_password_encrypted = Column(Text, nullable=True)  # cifrado Fernet

    status = Column(SAEnum(Status, name="account_status"),
                    default=Status.activo, index=True)
    notes = Column(Text)

    # ---- identidad del perfil (persona ficticia usada en las redes) ----
    profile_name = Column(String(150), nullable=False)   # identificador principal
    birth_date = Column(Date)                # "Fecha de Nacimiento"
    traits = Column(JSON, nullable=False, default=list, server_default="[]")

    device_id = Column(Integer, ForeignKey("devices.id", ondelete="SET NULL"),
                       index=True)

    created_by = Column(Integer, ForeignKey("users.id"))
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    device = relationship("Device", back_populates="accounts")
    social_accounts = relationship(
        "SocialAccount", back_populates="account",
        cascade="all, delete-orphan")
