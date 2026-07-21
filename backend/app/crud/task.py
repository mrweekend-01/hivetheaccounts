from datetime import datetime, timezone
from sqlalchemy.orm import Session, joinedload
from app.models.task import Task
from app.models.task_action import TaskAction
from app.models.account import Account
from app.core.enums import Platform
from app.schemas.task import TaskActionPlatform, TaskPersonaRow, TaskHistoryItem

PLATFORM_ORDER = [Platform.facebook, Platform.instagram, Platform.tiktok]


# ---------------- CRUD básico ----------------

def create_task(db: Session, link: str = "") -> Task:
    task = Task(link=link)
    db.add(task)
    db.commit()
    db.refresh(task)
    return task


def get_task(db: Session, task_id: int) -> Task | None:
    return db.query(Task).filter(Task.id == task_id).first()


def update_task_fields(db: Session, task_id: int, link: str | None = None,
                       comment: str | None = ...) -> Task:
    """Actualiza link y/o comment de forma independiente: cada uno solo se
    toca si se pasó explícitamente (comment usa `...` como centinela de
    'no tocar' porque None es un valor válido para borrar el comentario)."""
    task = get_task(db, task_id)
    if link is not None:
        task.link = link
    if comment is not ...:
        task.comment = comment
    task.updated_at = datetime.now(timezone.utc)
    db.commit()
    db.refresh(task)
    return task


def delete_task(db: Session, task: Task) -> None:
    db.delete(task)   # cascada por FK: borra también sus task_actions
    db.commit()


# ---------------- acciones ----------------

def toggle_action(db: Session, task_id: int, social_account_id: int,
                  field: str, value: bool) -> TaskAction:
    ta = (db.query(TaskAction)
          .filter(TaskAction.task_id == task_id,
                  TaskAction.social_account_id == social_account_id)
          .first())
    if ta is None:
        ta = TaskAction(task_id=task_id, social_account_id=social_account_id)
        db.add(ta)
    setattr(ta, field, value)
    task = get_task(db, task_id)
    task.updated_at = datetime.now(timezone.utc)
    db.commit()
    db.refresh(ta)
    return ta


def toggle_all_for_persona(db: Session, task_id: int, account_id: int) -> None:
    """Toggle inteligente: si falta marcar alguna acción activa, marca TODAS
    en true; si ya estaban todas en true, las desmarca (deshacer). Las redes
    sin credenciales (inactivas) se ignoran por completo."""
    account = (db.query(Account)
              .options(joinedload(Account.social_accounts))
              .filter(Account.id == account_id).first())
    if account is None:
        return
    active_sa_ids = [sa.id for sa in account.social_accounts
                    if sa.username and sa.password_encrypted]
    if not active_sa_ids:
        return

    existing = (db.query(TaskAction)
               .filter(TaskAction.task_id == task_id,
                       TaskAction.social_account_id.in_(active_sa_ids))
               .all())
    by_sa = {a.social_account_id: a for a in existing}
    all_done = all(
        (ta := by_sa.get(sa_id)) and ta.liked and ta.shared and ta.commented and ta.followed
        for sa_id in active_sa_ids
    )
    new_value = not all_done

    for sa_id in active_sa_ids:
        ta = by_sa.get(sa_id)
        if ta is None:
            ta = TaskAction(task_id=task_id, social_account_id=sa_id)
            db.add(ta)
        ta.liked = new_value
        ta.shared = new_value
        ta.commented = new_value
        ta.followed = new_value

    task = get_task(db, task_id)
    if task:
        task.updated_at = datetime.now(timezone.utc)
    db.commit()


def mark_task_complete(db: Session, task_id: int, value: bool) -> None:
    """Marca (o desmarca) liked/shared/commented/followed en `value` para
    TODAS las redes activas de TODAS las personas de la tarea, de una sola
    vez (mismo criterio que toggle_all_for_persona pero para todas las
    personas juntas, no una por una)."""
    accounts = (db.query(Account)
               .options(joinedload(Account.social_accounts))
               .all())
    active_sa_ids: list[int] = []
    for acc in accounts:
        active_sa_ids.extend(
            sa.id for sa in acc.social_accounts if sa.username and sa.password_encrypted
        )
    if not active_sa_ids:
        return

    existing = (db.query(TaskAction)
               .filter(TaskAction.task_id == task_id,
                       TaskAction.social_account_id.in_(active_sa_ids))
               .all())
    by_sa = {a.social_account_id: a for a in existing}

    for sa_id in active_sa_ids:
        ta = by_sa.get(sa_id)
        if ta is None:
            ta = TaskAction(task_id=task_id, social_account_id=sa_id)
            db.add(ta)
        ta.liked = value
        ta.shared = value
        ta.commented = value
        ta.followed = value

    task = get_task(db, task_id)
    if task:
        task.updated_at = datetime.now(timezone.utc)
    db.commit()


def reset_task_actions(db: Session, task_id: int) -> int:
    """Limpia todo el progreso (liked/shared/commented) de ESTA tarea puntual."""
    actions = db.query(TaskAction).filter(TaskAction.task_id == task_id).all()
    for ta in actions:
        ta.liked = False
        ta.shared = False
        ta.commented = False
        ta.followed = False
    task = get_task(db, task_id)
    if task:
        task.updated_at = datetime.now(timezone.utc)
    db.commit()
    return len(actions)


# ---------------- lectura para vistas ----------------

def build_persona_rows(db: Session, task_id: int) -> list[TaskPersonaRow]:
    accounts = (db.query(Account)
                .options(joinedload(Account.social_accounts), joinedload(Account.device))
                .order_by(Account.corporate_email)
                .all())

    actions = db.query(TaskAction).filter(TaskAction.task_id == task_id).all()
    actions_by_sa = {a.social_account_id: a for a in actions}

    rows: list[TaskPersonaRow] = []
    for acc in accounts:
        by_platform = {sa.platform: sa for sa in acc.social_accounts}
        platforms: list[TaskActionPlatform] = []
        for platform in PLATFORM_ORDER:
            sa = by_platform.get(platform)
            active = bool(sa and sa.username and sa.password_encrypted)
            if not active:
                platforms.append(TaskActionPlatform(
                    platform=platform, social_account_id=None, active=False,
                ))
                continue
            ta = actions_by_sa.get(sa.id)
            platforms.append(TaskActionPlatform(
                platform=platform, social_account_id=sa.id, active=True,
                liked=bool(ta and ta.liked),
                shared=bool(ta and ta.shared),
                commented=bool(ta and ta.commented),
                followed=bool(ta and ta.followed),
            ))
        device_label = (acc.device.nickname or acc.device.name) if acc.device else None
        boxphone = acc.device.boxphone if acc.device else None
        rows.append(TaskPersonaRow(
            account_id=acc.id, profile_name=acc.profile_name,
            corporate_email=acc.corporate_email, status=acc.status.value,
            device_id=acc.device_id, device_label=device_label, boxphone=boxphone,
            platforms=platforms,
        ))
    return rows


def _completion(rows: list[TaskPersonaRow]) -> tuple[int, int]:
    total = 0
    done = 0
    for row in rows:
        for p in row.platforms:
            if not p.active:
                continue
            total += 4
            done += ((1 if p.liked else 0) + (1 if p.shared else 0) +
                    (1 if p.commented else 0) + (1 if p.followed else 0))
    return done, total


def list_all(db: Session) -> list[TaskHistoryItem]:
    # orden fijo desde la creación: created_at nunca cambia, así que las
    # tareas nunca cambian de posición al avanzar su progreso.
    tasks = db.query(Task).order_by(Task.created_at.asc()).all()
    items: list[TaskHistoryItem] = []
    for order_number, t in enumerate(tasks, start=1):
        rows = build_persona_rows(db, t.id)
        done, total = _completion(rows)
        items.append(TaskHistoryItem(
            id=t.id, order_number=order_number, link=t.link, comment=t.comment,
            created_at=t.created_at, updated_at=t.updated_at,
            completed_count=done, total_count=total,
        ))
    return items
