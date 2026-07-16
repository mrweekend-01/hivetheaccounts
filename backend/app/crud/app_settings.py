"""CRUD para la fila única (id=1) de ajustes globales de la app."""
from sqlalchemy.orm import Session
from app.models.app_settings import AppSettings

DEFAULT_HUMANIZATION_MINUTES = 30


def get(db: Session) -> AppSettings:
    row = db.query(AppSettings).filter(AppSettings.id == 1).first()
    if row is None:
        # salvaguarda: la migración ya siembra esta fila, esto no debería ocurrir
        row = AppSettings(id=1, humanization_minutes=DEFAULT_HUMANIZATION_MINUTES)
        db.add(row)
        db.commit()
        db.refresh(row)
    return row


def get_humanization_minutes(db: Session) -> int:
    return get(db).humanization_minutes


def set_humanization_minutes(db: Session, minutes: int) -> AppSettings:
    row = get(db)
    row.humanization_minutes = minutes
    db.commit()
    db.refresh(row)
    return row
