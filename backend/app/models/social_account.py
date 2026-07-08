from sqlalchemy import (Column, Integer, String, Text, DateTime,
                        ForeignKey, Enum as SAEnum, UniqueConstraint)
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.core.database import Base
from app.core.enums import Status, Platform, HumanizationStatus


class SocialAccount(Base):
    """El login REAL de una red social para una persona (Account). A veces es
    un teléfono, a veces un correo distinto al de respaldo. Puede crearse sin
    credenciales todavía ('pendiente') cuando solo se sabe que la red existe."""
    __tablename__ = "social_accounts"

    id = Column(Integer, primary_key=True, index=True)
    account_id = Column(Integer, ForeignKey("accounts.id", ondelete="CASCADE"),
                        nullable=False)
    platform = Column(SAEnum(Platform, name="platform"), nullable=False, index=True)

    # nullable: una cuenta puede registrarse como "pendiente de credenciales"
    username = Column(String(150))
    password_encrypted = Column(Text)  # cifrado Fernet

    slot_number = Column(Integer)      # "Perfil #" -> slot 1-5 dentro del celular
    profile_url = Column(Text)         # link al perfil (ej. facebook.com/profile.php?id=...)

    status = Column(SAEnum(Status, name="social_status"),
                    default=Status.activo, index=True)
    notes = Column(Text)

    # ---- humanización (por red social individual) ----
    humanization_status = Column(
        SAEnum(HumanizationStatus, name="social_humanization_status"),
        default=HumanizationStatus.pendiente, index=True)
    humanization_started_at = Column(DateTime(timezone=True))
    humanization_done_at = Column(DateTime(timezone=True))

    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    account = relationship("Account", back_populates="social_accounts")

    __table_args__ = (
        UniqueConstraint("account_id", "platform", name="uq_account_platform"),
    )
