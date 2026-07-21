from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.core.enums import Role
from app.crud import task as crud
from app.schemas.task import TaskDetail, TaskHistoryItem
from app.api.deps import get_current_user, require_roles

router = APIRouter(prefix="/tasks", tags=["tasks"])

VALID_FIELDS = {"liked", "shared", "commented", "followed"}


class TaskCreateBody(BaseModel):
    link: str = ""


class LinkUpdate(BaseModel):
    link: str | None = None
    comment: str | None = None


class ActionUpdate(BaseModel):
    field: str
    value: bool


class CompleteBody(BaseModel):
    value: bool


def _detail(db: Session, task_id: int) -> TaskDetail:
    task = crud.get_task(db, task_id)
    if not task:
        raise HTTPException(404, "Tarea no encontrada")
    rows = crud.build_persona_rows(db, task.id)
    return TaskDetail(id=task.id, link=task.link, comment=task.comment,
                      created_at=task.created_at, updated_at=task.updated_at, rows=rows)


@router.get("", response_model=list[TaskHistoryItem])
def list_tasks(db: Session = Depends(get_db), _=Depends(get_current_user)):
    return crud.list_all(db)


@router.post("", response_model=TaskDetail)
def create_task(data: TaskCreateBody, db: Session = Depends(get_db),
                _=Depends(get_current_user)):
    task = crud.create_task(db, data.link)
    return _detail(db, task.id)


@router.get("/{task_id}", response_model=TaskDetail)
def get_task(task_id: int, db: Session = Depends(get_db),
            _=Depends(get_current_user)):
    return _detail(db, task_id)


@router.put("/{task_id}", response_model=TaskDetail)
def update_task(task_id: int, data: LinkUpdate, db: Session = Depends(get_db),
                _=Depends(get_current_user)):
    if not crud.get_task(db, task_id):
        raise HTTPException(404, "Tarea no encontrada")
    fields_set = data.model_fields_set
    crud.update_task_fields(
        db, task_id,
        link=data.link if "link" in fields_set else None,
        comment=data.comment if "comment" in fields_set else ...,
    )
    return _detail(db, task_id)


@router.delete("/{task_id}", status_code=204)
def delete_task(task_id: int, db: Session = Depends(get_db),
                _=Depends(require_roles(Role.admin))):
    task = crud.get_task(db, task_id)
    if not task:
        raise HTTPException(404, "Tarea no encontrada")
    crud.delete_task(db, task)


@router.patch("/{task_id}/actions/{social_account_id}", response_model=TaskDetail)
def update_action(task_id: int, social_account_id: int, data: ActionUpdate,
                  db: Session = Depends(get_db), _=Depends(get_current_user)):
    if data.field not in VALID_FIELDS:
        raise HTTPException(422, f"field debe ser uno de {VALID_FIELDS}")
    if not crud.get_task(db, task_id):
        raise HTTPException(404, "Tarea no encontrada")
    crud.toggle_action(db, task_id, social_account_id, data.field, data.value)
    return _detail(db, task_id)


@router.post("/{task_id}/persons/{account_id}/toggle-all", response_model=TaskDetail)
def toggle_all_actions(task_id: int, account_id: int, db: Session = Depends(get_db),
                       _=Depends(get_current_user)):
    if not crud.get_task(db, task_id):
        raise HTTPException(404, "Tarea no encontrada")
    crud.toggle_all_for_persona(db, task_id, account_id)
    return _detail(db, task_id)


@router.post("/{task_id}/complete", response_model=TaskDetail)
def complete_task(task_id: int, data: CompleteBody, db: Session = Depends(get_db),
                  _=Depends(get_current_user)):
    if not crud.get_task(db, task_id):
        raise HTTPException(404, "Tarea no encontrada")
    crud.mark_task_complete(db, task_id, data.value)
    return _detail(db, task_id)


@router.post("/{task_id}/reset", response_model=TaskDetail)
def reset_task(task_id: int, db: Session = Depends(get_db),
              _=Depends(get_current_user)):
    if not crud.get_task(db, task_id):
        raise HTTPException(404, "Tarea no encontrada")
    crud.reset_task_actions(db, task_id)
    return _detail(db, task_id)
