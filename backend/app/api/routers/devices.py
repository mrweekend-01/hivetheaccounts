from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.core.enums import Role
from app.crud import device as crud
from app.schemas.device import DeviceOut, DeviceCreate, DeviceUpdate
from app.schemas.proxy import ProxyOut
from app.api.deps import get_current_user, require_roles

router = APIRouter(prefix="/devices", tags=["devices"])


def _to_out(d) -> DeviceOut:
    out = DeviceOut.model_validate(d)
    out.account_count = len(d.accounts)
    out.proxy = ProxyOut.model_validate(d.proxy) if d.proxy else None
    return out


@router.get("", response_model=list[DeviceOut])
def list_devices(db: Session = Depends(get_db), _=Depends(get_current_user)):
    return [_to_out(d) for d in crud.list_all(db)]


@router.get("/{device_id}", response_model=DeviceOut)
def get_device(device_id: int, db: Session = Depends(get_db),
               _=Depends(get_current_user)):
    d = crud.get(db, device_id)
    if not d:
        raise HTTPException(404, "Dispositivo no encontrado")
    return _to_out(d)


@router.post("", response_model=DeviceOut, status_code=201)
def create_device(data: DeviceCreate, db: Session = Depends(get_db),
                  _=Depends(require_roles(Role.admin, Role.editor))):
    try:
        d = crud.create(db, data)
    except Exception:
        db.rollback()
        raise HTTPException(400, "Nombre duplicado o proxy ya asignada a otro celular")
    return _to_out(crud.get(db, d.id))


@router.put("/{device_id}", response_model=DeviceOut)
def update_device(device_id: int, data: DeviceUpdate, db: Session = Depends(get_db),
                  _=Depends(require_roles(Role.admin, Role.editor))):
    d = crud.get(db, device_id)
    if not d:
        raise HTTPException(404, "Dispositivo no encontrado")
    try:
        crud.update(db, d, data)
    except Exception:
        db.rollback()
        raise HTTPException(400, "Nombre duplicado o proxy ya asignada a otro celular")
    return _to_out(crud.get(db, device_id))


@router.delete("/{device_id}", status_code=204)
def delete_device(device_id: int, db: Session = Depends(get_db),
                  _=Depends(require_roles(Role.admin))):
    d = crud.get(db, device_id)
    if not d:
        raise HTTPException(404, "Dispositivo no encontrado")
    crud.delete(db, d)
