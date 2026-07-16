from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.crud import social_account as crud
from app.crud import app_settings as crud_settings
from app.core.enums import Platform
from app.schemas.humanization import (HumanizationView, HumanizationGroup,
                                      HumanizationPersona, HumanizationSocialIcon)
from app.api.deps import get_current_user

router = APIRouter(prefix="/humanization", tags=["humanization"])

PLATFORM_ORDER = [Platform.facebook, Platform.instagram, Platform.tiktok]


def _build_icon(db: Session, platform: Platform, sa) -> tuple[HumanizationSocialIcon, bool]:
    """Devuelve (icono, tiene_credenciales). last_humanized_at se expone aunque
    la red esté sin credenciales o recién reiniciada: sobrevive a los reinicios."""
    if sa is None or not sa.username or not sa.password_encrypted:
        return HumanizationSocialIcon(
            platform=platform, social_account_id=None,
            state="sin_credenciales", remaining_seconds=0,
            last_humanized_at=sa.last_humanized_at if sa else None,
        ), False
    return HumanizationSocialIcon(
        platform=platform, social_account_id=sa.id,
        state=sa.humanization_status.value,
        remaining_seconds=crud._remaining_seconds(db, sa),
        last_humanized_at=sa.last_humanized_at,
    ), True


@router.get("", response_model=HumanizationView)
def humanization_view(db: Session = Depends(get_db), _=Depends(get_current_user)):
    # cierra timers vencidos (por si un navegador se cerró a mitad)
    crud.auto_finalize_expired(db)

    accounts = crud.list_all_accounts_for_humanization(db)

    by_device: dict[int | None, list] = {}
    device_names: dict[int | None, str] = {}
    for acc in accounts:
        dev_id = acc.device_id
        by_device.setdefault(dev_id, []).append(acc)
        device_names[dev_id] = acc.device.name if acc.device else "Sin celular asignado"

    groups: list[HumanizationGroup] = []
    icons_with_creds: list[HumanizationSocialIcon] = []
    for dev_id, accs in by_device.items():
        personas: list[HumanizationPersona] = []
        for acc in accs:
            by_platform = {sa.platform: sa for sa in acc.social_accounts}
            icons: list[HumanizationSocialIcon] = []
            for platform in PLATFORM_ORDER:
                icon, has_creds = _build_icon(db, platform, by_platform.get(platform))
                if has_creds:
                    icons_with_creds.append(icon)
                icons.append(icon)
            personas.append(HumanizationPersona(
                account_id=acc.id, profile_name=acc.profile_name,
                corporate_email=acc.corporate_email, traits=acc.traits or [],
                socials=icons,
            ))
        groups.append(HumanizationGroup(
            device_id=dev_id, device_name=device_names[dev_id], personas=personas,
        ))
    groups.sort(key=lambda g: g.device_name)

    all_done = bool(icons_with_creds) and all(
        icon.state == "hecho" for icon in icons_with_creds)

    return HumanizationView(
        humanization_minutes=crud_settings.get_humanization_minutes(db),
        all_done=all_done,
        groups=groups,
    )


@router.post("/{social_account_id}/start")
def start(social_account_id: int, db: Session = Depends(get_db),
          _=Depends(get_current_user)):
    sa = crud.get(db, social_account_id)
    if not sa:
        raise HTTPException(404, "Red social no encontrada")
    sa = crud.start_humanization(db, sa)
    return {"ok": True, "remaining_seconds": sa.humanization_duration_minutes * 60}


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
