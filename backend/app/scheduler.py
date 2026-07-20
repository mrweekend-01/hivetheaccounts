"""Planificador en segundo plano: revisa cada minuto si algún horario programado debe
disparar el inicio de una humanización, y también cierra timers vencidos aunque nadie
tenga la app abierta.

LIMITACIÓN CONOCIDA: este scheduler corre dentro del propio proceso del backend
(BackgroundScheduler in-process, no un worker separado). Asume una sola réplica/
instancia del contenedor backend corriendo a la vez -- así está desplegado hoy en
docker-compose.prod.yml (un solo servicio "backend", sin `deploy.replicas` ni
`uvicorn --workers`). Si en algún momento se escala el backend a varias réplicas,
cada una correría su propia copia de este scheduler y los horarios se dispararían
duplicados. Antes de escalar el backend habría que mover esto a un job/worker
separado (o coordinarlo con un lock, ej. un advisory lock de Postgres).
"""
from datetime import datetime
from zoneinfo import ZoneInfo
from apscheduler.schedulers.background import BackgroundScheduler
from app.core.database import SessionLocal
from app.core.enums import HumanizationStatus
from app.models.humanization_schedule import HumanizationSchedule
from app.models.social_account import SocialAccount
from app.crud import social_account as crud_social

TZ = ZoneInfo("America/Lima")


def _check_schedules():
    db = SessionLocal()
    try:
        now = datetime.now(TZ)
        weekday = now.weekday()  # 0=lunes
        current_time = now.time().replace(second=0, microsecond=0)

        schedules = db.query(HumanizationSchedule).filter(
            HumanizationSchedule.active == True
        ).all()

        for sched in schedules:
            # ¿coincide el día?
            if sched.days_of_week:
                days = [int(d) for d in sched.days_of_week.split(",")]
                if weekday not in days:
                    continue
            # ¿coincide la hora (con margen de 1 minuto, ya que este check corre cada minuto)?
            if sched.time_of_day.hour != current_time.hour or sched.time_of_day.minute != current_time.minute:
                continue

            sa = db.get(SocialAccount, sched.social_account_id)
            if not sa or not sa.username or not sa.password_encrypted:
                continue  # sin credenciales, no aplica
            # No pisar un timer ya en curso o pausado
            if sa.humanization_status in (HumanizationStatus.en_proceso, HumanizationStatus.pausado):
                continue

            crud_social.start_humanization(db, sa)

        crud_social.auto_finalize_expired(db)
    finally:
        db.close()


scheduler = BackgroundScheduler(timezone=str(TZ))
scheduler.add_job(_check_schedules, "interval", minutes=1, id="humanization_scheduler")
