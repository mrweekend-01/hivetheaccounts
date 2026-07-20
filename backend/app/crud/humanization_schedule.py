from datetime import time
from sqlalchemy.orm import Session, joinedload
from app.models.humanization_schedule import HumanizationSchedule
from app.models.social_account import SocialAccount
from app.schemas.humanization_schedule import ScheduleCreate, ScheduleUpdate, ScheduleOut


def _days_to_str(days: list[int] | None) -> str | None:
    if not days:
        return None
    return ",".join(str(d) for d in days)


def _days_to_list(days: str | None) -> list[int] | None:
    if not days:
        return None
    return [int(d) for d in days.split(",")]


def _to_out(sched: HumanizationSchedule) -> ScheduleOut:
    sa = sched.social_account
    return ScheduleOut(
        id=sched.id,
        social_account_id=sched.social_account_id,
        profile_name=sa.account.profile_name if sa and sa.account else None,
        platform=sa.platform if sa else None,
        time_of_day=sched.time_of_day.strftime("%H:%M"),
        days_of_week=_days_to_list(sched.days_of_week),
        active=sched.active,
    )


def list_all(db: Session) -> list[ScheduleOut]:
    rows = (db.query(HumanizationSchedule)
            .options(joinedload(HumanizationSchedule.social_account)
                    .joinedload(SocialAccount.account))
            .order_by(HumanizationSchedule.time_of_day)
            .all())
    return [_to_out(r) for r in rows]


def create(db: Session, data: ScheduleCreate) -> ScheduleOut:
    hh, mm = data.time_of_day.split(":")
    sched = HumanizationSchedule(
        social_account_id=data.social_account_id,
        time_of_day=time(int(hh), int(mm)),
        days_of_week=_days_to_str(data.days_of_week),
        active=data.active,
    )
    db.add(sched)
    db.commit()
    db.refresh(sched)
    return _to_out(sched)


def get(db: Session, schedule_id: int) -> HumanizationSchedule | None:
    return db.get(HumanizationSchedule, schedule_id)


def update(db: Session, sched: HumanizationSchedule, data: ScheduleUpdate) -> ScheduleOut:
    payload = data.model_dump(exclude_unset=True)
    if "time_of_day" in payload:
        hh, mm = payload.pop("time_of_day").split(":")
        sched.time_of_day = time(int(hh), int(mm))
    if "days_of_week" in payload:
        sched.days_of_week = _days_to_str(payload.pop("days_of_week"))
    for k, v in payload.items():
        setattr(sched, k, v)
    db.commit()
    db.refresh(sched)
    return _to_out(sched)


def delete(db: Session, sched: HumanizationSchedule) -> None:
    db.delete(sched)
    db.commit()
