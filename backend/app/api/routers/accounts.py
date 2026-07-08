from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.core.enums import Role
from app.crud import account as crud
from app.schemas.account import (AccountListItem, AccountDetail, AccountCreate,
                                 AccountUpdate)
from app.schemas.social_account import SocialAccountReveal
from app.schemas.proxy import ProxyReveal
from app.core.crypto import decrypt
from app.api.deps import get_current_user, require_roles, can_reveal
from app.models.user import User

router = APIRouter(prefix="/accounts", tags=["accounts"])


def _list_item(acc) -> AccountListItem:
    return AccountListItem(
        id=acc.id, corporate_email=acc.corporate_email,
        profile_name=acc.profile_name, status=acc.status,
        device_id=acc.device_id,
        device_name=acc.device.name if acc.device else None,
        socials=crud.socials_presence(acc),
    )


@router.get("", response_model=list[AccountListItem])
def list_accounts(platform: str | None = None, status: str | None = None,
                  device_id: int | None = None, search: str | None = None,
                  db: Session = Depends(get_db), _=Depends(get_current_user)):
    rows = crud.list_accounts(db, platform=platform, status=status,
                              device_id=device_id, search=search)
    return [_list_item(a) for a in rows]


@router.get("/{account_id}", response_model=AccountDetail)
def get_account(account_id: int, reveal: bool = False,
                db: Session = Depends(get_db),
                current: User = Depends(get_current_user)):
    acc = crud.get(db, account_id)
    if not acc:
        raise HTTPException(404, "Cuenta no encontrada")

    if reveal and current.role == Role.operador:
        raise HTTPException(403, "El operador no puede revelar contraseñas")

    detail = AccountDetail(
        id=acc.id, corporate_email=acc.corporate_email, status=acc.status,
        notes=acc.notes, device_id=acc.device_id,
        device_name=acc.device.name if acc.device else None,
        profile_name=acc.profile_name, birth_date=acc.birth_date,
        sequence_number=acc.sequence_number,
        created_at=acc.created_at, socials=[], proxy=None,
    )
    for sa in acc.social_accounts:
        detail.socials.append(SocialAccountReveal(
            id=sa.id, platform=sa.platform, username=sa.username,
            slot_number=sa.slot_number, profile_url=sa.profile_url,
            status=sa.status, notes=sa.notes,
            humanization_status=sa.humanization_status,
            password=decrypt(sa.password_encrypted) if reveal else None,
        ))
    if acc.device and acc.device.proxy:
        p = acc.device.proxy
        detail.proxy = ProxyReveal.model_validate(p)
        detail.proxy.password = decrypt(p.password_encrypted) if reveal else None
    if reveal:
        detail.corp_password = decrypt(acc.corp_password_encrypted)
    return detail


@router.post("", response_model=AccountDetail, status_code=201)
def create_account(data: AccountCreate, db: Session = Depends(get_db),
                   current: User = Depends(require_roles(Role.admin, Role.editor))):
    try:
        acc = crud.create(db, data, created_by=current.id)
    except Exception:
        db.rollback()
        raise HTTPException(400, "Correo corporativo duplicado o datos inválidos")
    return get_account(acc.id, reveal=False, db=db, current=current)


@router.put("/{account_id}", response_model=AccountDetail)
def update_account(account_id: int, data: AccountUpdate, db: Session = Depends(get_db),
                   current: User = Depends(require_roles(Role.admin, Role.editor))):
    acc = crud.get(db, account_id)
    if not acc:
        raise HTTPException(404, "Cuenta no encontrada")
    crud.update(db, acc, data)
    return get_account(account_id, reveal=False, db=db, current=current)


@router.delete("/{account_id}", status_code=204)
def delete_account(account_id: int, db: Session = Depends(get_db),
                   _=Depends(require_roles(Role.admin))):
    acc = crud.get(db, account_id)
    if not acc:
        raise HTTPException(404, "Cuenta no encontrada")
    crud.delete(db, acc)
