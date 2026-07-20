from sqlalchemy.orm import Session, joinedload
from app.models.account import Account
from app.models.device import Device
from app.models.social_account import SocialAccount
from app.core.enums import Platform, PresenceState
from app.schemas.account import AccountCreate, AccountUpdate, SocialsPresence
from app.core.crypto import encrypt, decrypt
from app.core.config import settings


# ---------------- lectura ----------------

def _query(db: Session):
    return db.query(Account).options(
        joinedload(Account.social_accounts),
        joinedload(Account.device),
    )


def get(db: Session, account_id: int) -> Account | None:
    return _query(db).filter(Account.id == account_id).first()


def list_accounts(db: Session, *, platform: str | None = None,
                  status: str | None = None, device_id: int | None = None,
                  boxphone: str | None = None,
                  search: str | None = None) -> list[Account]:
    q = _query(db)
    if status:
        q = q.filter(Account.status == status)
    if device_id:
        q = q.filter(Account.device_id == device_id)
    if boxphone:
        q = q.filter(Account.device.has(Device.boxphone == boxphone))
    if search:
        like = f"%{search}%"
        q = q.filter(Account.profile_name.ilike(like) | Account.corporate_email.ilike(like))
    if platform:
        q = q.filter(Account.social_accounts.any(SocialAccount.platform == platform))
    return q.order_by(Account.profile_name).all()


def _presence_for(account: Account, platform: Platform) -> PresenceState:
    sa = next((s for s in account.social_accounts if s.platform == platform), None)
    if sa is None:
        return PresenceState.no_existe
    if sa.username and sa.password_encrypted:
        return PresenceState.activa
    return PresenceState.pendiente


def socials_presence(account: Account) -> SocialsPresence:
    return SocialsPresence(
        facebook=_presence_for(account, Platform.facebook),
        instagram=_presence_for(account, Platform.instagram),
        tiktok=_presence_for(account, Platform.tiktok),
    )


# ---------------- escritura ----------------

def _apply_socials(db: Session, account: Account, socials) -> None:
    """Reemplaza el set de redes de la cuenta."""
    account.social_accounts.clear()
    db.flush()
    for s in socials:
        account.social_accounts.append(SocialAccount(
            platform=s.platform,
            username=s.username,
            profile_url=s.profile_url,
            status=s.status,
            notes=s.notes,
            password_encrypted=encrypt(s.password),
        ))


def create(db: Session, data: AccountCreate, created_by: int | None) -> Account:
    account = Account(
        corporate_email=data.corporate_email,
        corp_password_encrypted=encrypt(data.corp_password),
        status=data.status,
        notes=data.notes,
        profile_name=data.profile_name,
        birth_date=data.birth_date,
        traits=data.traits,
        description=data.description,
        connection_schedule=[s.model_dump() for s in data.connection_schedule],
        followed_profiles=[f.model_dump() for f in data.followed_profiles],
        device_id=data.device_id,
        created_by=created_by,
    )
    for s in data.socials:
        account.social_accounts.append(SocialAccount(
            platform=s.platform, username=s.username, status=s.status,
            notes=s.notes, profile_url=s.profile_url,
            password_encrypted=encrypt(s.password),
        ))
    db.add(account)
    db.commit()
    db.refresh(account)
    return account


def update(db: Session, account: Account, data: AccountUpdate) -> Account:
    payload = data.model_dump(exclude_unset=True)
    socials = payload.pop("socials", None)
    if "corp_password" in payload:
        account.corp_password_encrypted = encrypt(payload.pop("corp_password"))
    for k, v in payload.items():
        setattr(account, k, v)
    if socials is not None:
        _apply_socials(db, account, data.socials)
    db.commit()
    db.refresh(account)
    return account


def delete(db: Session, account: Account) -> None:
    db.delete(account)
    db.commit()


# ---------------- credenciales descifradas (reveal) ----------------

def reveal_corp_password(account: Account) -> str | None:
    return decrypt(account.corp_password_encrypted)


