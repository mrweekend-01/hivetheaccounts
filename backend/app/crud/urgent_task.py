from datetime import datetime, timezone
from sqlalchemy.orm import Session, joinedload
from app.models.urgent_task import UrgentTask
from app.core.enums import UrgentStatus
from app.schemas.urgent_task import UrgentTaskCreate, UrgentTaskUpdate, UrgentTaskOut


def _to_out(t: UrgentTask) -> UrgentTaskOut:
    return UrgentTaskOut(
        id=t.id, title=t.title, description=t.description,
        priority=t.priority, status=t.status, assigned_to=t.assigned_to,
        assignee_name=(t.assignee.full_name or t.assignee.username) if t.assignee else None,
        created_at=t.created_at, finished_at=t.finished_at,
    )


def _query(db: Session):
    return db.query(UrgentTask).options(joinedload(UrgentTask.assignee))


def get(db: Session, task_id: int) -> UrgentTask | None:
    return _query(db).filter(UrgentTask.id == task_id).first()


def list_all(db: Session) -> list[UrgentTaskOut]:
    rows = _query(db).order_by(UrgentTask.created_at.desc()).all()
    return [_to_out(t) for t in rows]


def create(db: Session, data: UrgentTaskCreate, created_by: int | None) -> UrgentTaskOut:
    task = UrgentTask(
        title=data.title, description=data.description,
        priority=data.priority, assigned_to=data.assigned_to,
        created_by=created_by,
    )
    db.add(task)
    db.commit()
    db.refresh(task)
    return _to_out(get(db, task.id))


def update(db: Session, task: UrgentTask, data: UrgentTaskUpdate) -> UrgentTaskOut:
    payload = data.model_dump(exclude_unset=True)
    status = payload.pop("status", None)
    for k, v in payload.items():
        setattr(task, k, v)
    if status is not None:
        _apply_status(task, status)
    db.commit()
    db.refresh(task)
    return _to_out(get(db, task.id))


def _apply_status(task: UrgentTask, new_status: UrgentStatus) -> None:
    if new_status == UrgentStatus.finalizada:
        if task.status != UrgentStatus.finalizada or not task.finished_at:
            task.finished_at = datetime.now(timezone.utc)
    elif task.status == UrgentStatus.finalizada:
        # se reabre una tarea que estaba marcada como terminada
        task.finished_at = None
    task.status = new_status


def update_status(db: Session, task: UrgentTask, new_status: UrgentStatus) -> UrgentTaskOut:
    _apply_status(task, new_status)
    db.commit()
    db.refresh(task)
    return _to_out(get(db, task.id))


def delete(db: Session, task: UrgentTask) -> None:
    db.delete(task)
    db.commit()
