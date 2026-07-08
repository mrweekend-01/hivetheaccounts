from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.crud import social_account as crud
from app.core.enums import HumanizationStatus
from app.core.config import settings
from app.schemas.humanization import (HumanizationView, HumanizationGroup,
                                      HumanizationItem)
from app.api.deps import get_current_user

router = APIRouter(prefix="/humanization", tags=["humanization"])


@router.get("", response_model=HumanizationView)
def humanization_view(db: Session = Depends(get_db), _=Depends(get_current_user)):
    # cierra timers vencidos (por si un navegador se cerró a mitad)
    crud.auto_finalize_expired(db)

    rows = crud.list_for_humanization(db)

    by_device: dict[int | None, list] = {}
    device_names: dict[int | None, str] = {}
    for sa in rows:
        acc = sa.account
        dev_id = acc.device_id
        by_device.setdefault(dev_id, []).append(sa)
        device_names[dev_id] = acc.device.name if acc.device else "Sin celular asignado"

    groups: list[HumanizationGroup] = []
    for dev_id, items in by_device.items():
        groups.append(HumanizationGroup(
            device_id=dev_id,
            device_name=device_names[dev_id],
            items=[HumanizationItem(
                social_account_id=sa.id, account_id=sa.account_id,
                platform=sa.platform, profile_name=sa.account.profile_name,
                corporate_email=sa.account.corporate_email,
                humanization_status=sa.humanization_status,
                remaining_seconds=crud._remaining_seconds(sa),
            ) for sa in items],
        ))
    groups.sort(key=lambda g: g.device_name)

    all_done = bool(rows) and all(
        sa.humanization_status == HumanizationStatus.hecho for sa in rows)

    return HumanizationView(
        humanization_minutes=settings.HUMANIZATION_MINUTES,
        all_done=all_done,
        groups=groups,
    )


@router.post("/{social_account_id}/start")
def start(social_account_id: int, db: Session = Depends(get_db),
          _=Depends(get_current_user)):
    sa = crud.get(db, social_account_id)
    if not sa:
        raise HTTPException(404, "Red social no encontrada")
    crud.start_humanization(db, sa)
    return {"ok": True, "remaining_seconds": settings.HUMANIZATION_MINUTES * 60}


@router.post("/{social_account_id}/done")
def done(social_account_id: int, db: Session = Depends(get_db),
        _=Depends(get_current_user)):
    sa = crud.get(db, social_account_id)
    if not sa:
        raise HTTPException(404, "Red social no encontrada")
    crud.finish_humanization(db, sa)
    return {"ok": True}


@router.post("/reset")
def reset(device_id: int | None = None, db: Session = Depends(get_db),
          _=Depends(get_current_user)):
    n = crud.reset_humanization(db, device_id=device_id)
    return {"ok": True, "reset_count": n}
