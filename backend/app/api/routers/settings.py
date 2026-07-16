from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.core.enums import Role
from app.crud import app_settings as crud
from app.schemas.app_settings import HumanizationSettingsOut, HumanizationSettingsUpdate
from app.api.deps import get_current_user, require_roles

router = APIRouter(prefix="/settings", tags=["settings"])

MIN_HUMANIZATION_MINUTES = 30


@router.get("/humanization", response_model=HumanizationSettingsOut)
def get_humanization_settings(db: Session = Depends(get_db), _=Depends(get_current_user)):
    return HumanizationSettingsOut(humanization_minutes=crud.get_humanization_minutes(db))


@router.put("/humanization", response_model=HumanizationSettingsOut)
def update_humanization_settings(data: HumanizationSettingsUpdate, db: Session = Depends(get_db),
                                 _=Depends(require_roles(Role.admin))):
    if data.humanization_minutes < MIN_HUMANIZATION_MINUTES:
        raise HTTPException(400, f"El mínimo son {MIN_HUMANIZATION_MINUTES} minutos")
    row = crud.set_humanization_minutes(db, data.humanization_minutes)
    return HumanizationSettingsOut(humanization_minutes=row.humanization_minutes)
