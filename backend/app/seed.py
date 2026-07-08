"""Siembra el primer usuario admin si no existe. Idempotente."""
from app.core.database import SessionLocal
from app.core.config import settings
from app.crud import user as crud_user
from app.schemas.user import UserCreate
from app.core.enums import Role


def run():
    db = SessionLocal()
    try:
        if not crud_user.get_by_username(db, settings.FIRST_ADMIN_USER):
            crud_user.create(db, UserCreate(
                username=settings.FIRST_ADMIN_USER,
                full_name="Administrador",
                password=settings.FIRST_ADMIN_PASSWORD,
                role=Role.admin,
            ))
            print(f"[seed] Admin creado: {settings.FIRST_ADMIN_USER}")
        else:
            print("[seed] Admin ya existe, nada que hacer")
    finally:
        db.close()


if __name__ == "__main__":
    run()
