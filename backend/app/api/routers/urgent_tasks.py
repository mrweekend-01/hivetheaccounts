from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.core.enums import Role
from app.crud import urgent_task as crud
from app.schemas.urgent_task import (UrgentTaskOut, UrgentTaskCreate,
                                     UrgentTaskUpdate, UrgentTaskStatusUpdate)
from app.api.deps import require_roles
from app.models.user import User

router = APIRouter(prefix="/urgent-tasks", tags=["urgent-tasks"])


@router.get("", response_model=list[UrgentTaskOut])
def list_urgent_tasks(db: Session = Depends(get_db), _=Depends(require_roles(Role.admin))):
    return crud.list_all(db)


@router.post("", response_model=UrgentTaskOut, status_code=201)
def create_urgent_task(data: UrgentTaskCreate, db: Session = Depends(get_db),
                       current: User = Depends(require_roles(Role.admin))):
    return crud.create(db, data, created_by=current.id)


@router.put("/{task_id}", response_model=UrgentTaskOut)
def update_urgent_task(task_id: int, data: UrgentTaskUpdate, db: Session = Depends(get_db),
                       _=Depends(require_roles(Role.admin))):
    task = crud.get(db, task_id)
    if not task:
        raise HTTPException(404, "Tarea urgente no encontrada")
    return crud.update(db, task, data)


@router.patch("/{task_id}/status", response_model=UrgentTaskOut)
def update_urgent_task_status(task_id: int, data: UrgentTaskStatusUpdate,
                              db: Session = Depends(get_db),
                              _=Depends(require_roles(Role.admin))):
    task = crud.get(db, task_id)
    if not task:
        raise HTTPException(404, "Tarea urgente no encontrada")
    return crud.update_status(db, task, data.status)


@router.delete("/{task_id}", status_code=204)
def delete_urgent_task(task_id: int, db: Session = Depends(get_db),
                       _=Depends(require_roles(Role.admin))):
    task = crud.get(db, task_id)
    if not task:
        raise HTTPException(404, "Tarea urgente no encontrada")
    crud.delete(db, task)
