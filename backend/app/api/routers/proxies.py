from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.core.enums import Role
from app.crud import proxy as crud
from app.schemas.proxy import ProxyOut, ProxyReveal, ProxyCreate, ProxyUpdate
from app.core.crypto import decrypt
from app.api.deps import get_current_user, require_roles, can_reveal

router = APIRouter(prefix="/proxies", tags=["proxies"])


@router.get("", response_model=list[ProxyOut])
def list_proxies(status: str | None = None, db: Session = Depends(get_db),
                 _=Depends(get_current_user)):
    return crud.list_all(db, status=status)


@router.get("/{proxy_id}", response_model=ProxyReveal)
def get_proxy(proxy_id: int, db: Session = Depends(get_db), _=Depends(can_reveal)):
    p = crud.get(db, proxy_id)
    if not p:
        raise HTTPException(404, "Proxy no encontrado")
    out = ProxyReveal.model_validate(p)
    out.password = decrypt(p.password_encrypted)
    return out


@router.post("", response_model=ProxyOut, status_code=201)
def create_proxy(data: ProxyCreate, db: Session = Depends(get_db),
                 _=Depends(require_roles(Role.admin, Role.editor))):
    return crud.create(db, data)


@router.put("/{proxy_id}", response_model=ProxyOut)
def update_proxy(proxy_id: int, data: ProxyUpdate, db: Session = Depends(get_db),
                 _=Depends(require_roles(Role.admin, Role.editor))):
    p = crud.get(db, proxy_id)
    if not p:
        raise HTTPException(404, "Proxy no encontrado")
    return crud.update(db, p, data)


@router.delete("/{proxy_id}", status_code=204)
def delete_proxy(proxy_id: int, db: Session = Depends(get_db),
                 _=Depends(require_roles(Role.admin))):
    p = crud.get(db, proxy_id)
    if not p:
        raise HTTPException(404, "Proxy no encontrado")
    crud.delete(db, p)
