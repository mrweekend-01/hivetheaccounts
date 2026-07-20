from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.crud import humanization_schedule as crud
from app.schemas.humanization_schedule import ScheduleOut, ScheduleCreate, ScheduleUpdate
from app.api.deps import get_current_user, require_roles
from app.core.enums import Role

router = APIRouter(prefix="/humanization-schedules", tags=["humanization-schedules"])


@router.get("", response_model=list[ScheduleOut])
def list_schedules(db: Session = Depends(get_db), _=Depends(get_current_user)):
    return crud.list_all(db)


@router.post("", response_model=ScheduleOut, status_code=201)
def create_schedule(data: ScheduleCreate, db: Session = Depends(get_db),
                    _=Depends(require_roles(Role.admin, Role.editor))):
    return crud.create(db, data)


@router.put("/{schedule_id}", response_model=ScheduleOut)
def update_schedule(schedule_id: int, data: ScheduleUpdate, db: Session = Depends(get_db),
                    _=Depends(require_roles(Role.admin, Role.editor))):
    sched = crud.get(db, schedule_id)
    if not sched:
        raise HTTPException(404, "Horario no encontrado")
    return crud.update(db, sched, data)


@router.delete("/{schedule_id}", status_code=204)
def delete_schedule(schedule_id: int, db: Session = Depends(get_db),
                    _=Depends(require_roles(Role.admin, Role.editor))):
    sched = crud.get(db, schedule_id)
    if not sched:
        raise HTTPException(404, "Horario no encontrado")
    crud.delete(db, sched)
