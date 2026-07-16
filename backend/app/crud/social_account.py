"""CRUD y lógica de humanización a nivel de cada red social individual."""
from datetime import datetime, timezone
from sqlalchemy.orm import Session, joinedload
from app.models.social_account import SocialAccount
from app.models.account import Account
from app.models.device import Device
from app.core.enums import HumanizationStatus
from app.core.crypto import decrypt
from app.crud import app_settings as crud_settings


def get(db: Session, social_account_id: int) -> SocialAccount | None:
    return (db.query(SocialAccount)
            .options(joinedload(SocialAccount.account))
            .filter(SocialAccount.id == social_account_id).first())


def reveal_password(sa: SocialAccount) -> str | None:
    return decrypt(sa.password_encrypted)


# ---------------- humanización ----------------

def _remaining_seconds(db: Session, sa: SocialAccount) -> int:
    if sa.humanization_status != HumanizationStatus.en_proceso:
        return 0
    if not sa.humanization_started_at:
        return 0
    minutes = sa.humanization_duration_minutes or crud_settings.get_humanization_minutes(db)
    elapsed = (datetime.now(timezone.utc) - sa.humanization_started_at).total_seconds()
    remaining = minutes * 60 - int(elapsed)
    return max(0, remaining)


def auto_finalize_expired(db: Session) -> None:
    """Cierra timers vencidos (navegador cerrado): en_proceso con tiempo agotado -> hecho."""
    now = datetime.now(timezone.utc)
    running = (db.query(SocialAccount)
               .filter(SocialAccount.humanization_status == HumanizationStatus.en_proceso)
               .all())
    changed = False
    for sa in running:
        if sa.humanization_started_at:
            minutes = sa.humanization_duration_minutes or crud_settings.get_humanization_minutes(db)
            elapsed = (now - sa.humanization_started_at).total_seconds()
            if elapsed >= minutes * 60:
                sa.humanization_status = HumanizationStatus.hecho
                sa.humanization_done_at = now
                changed = True
    if changed:
        db.commit()


def start_humanization(db: Session, sa: SocialAccount) -> SocialAccount:
    sa.humanization_status = HumanizationStatus.en_proceso
    sa.humanization_started_at = datetime.now(timezone.utc)
    sa.humanization_done_at = None
    sa.humanization_duration_minutes = crud_settings.get_humanization_minutes(db)
    db.commit()
    db.refresh(sa)
    return sa


def finish_humanization(db: Session, sa: SocialAccount) -> SocialAccount:
    now = datetime.now(timezone.utc)
    sa.humanization_status = HumanizationStatus.hecho
    sa.humanization_done_at = now
    sa.last_humanized_at = now
    db.commit()
    db.refresh(sa)
    return sa


def reset_humanization(db: Session, device_id: int | None = None) -> int:
    q = db.query(SocialAccount).join(Account)
    if device_id:
        q = q.filter(Account.device_id == device_id)
    n = 0
    for sa in q.all():
        sa.humanization_status = HumanizationStatus.pendiente
        sa.humanization_started_at = None
        sa.humanization_done_at = None
        n += 1
    db.commit()
    return n


def list_all_accounts_for_humanization(db: Session) -> list[Account]:
    """Todas las personas (cuentas), con sus redes y celular precargados, para
    construir la vista de humanización. Incluye personas sin credenciales
    todavía en alguna red (esa red se muestra como 'sin_credenciales')."""
    return (db.query(Account)
            .options(joinedload(Account.social_accounts),
                    joinedload(Account.device))
            .order_by(Account.corporate_email)
            .all())
