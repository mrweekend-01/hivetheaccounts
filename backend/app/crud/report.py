from sqlalchemy.orm import Session
from app.models.report import Report


def list_all(db: Session) -> list[Report]:
    return db.query(Report).order_by(Report.name).all()


def get(db: Session, report_id: int) -> Report | None:
    return db.query(Report).filter(Report.id == report_id).first()


def create(db: Session, name: str) -> Report:
    report = Report(name=name)
    db.add(report)
    db.commit()
    db.refresh(report)
    return report


def update(db: Session, report: Report, name: str) -> Report:
    report.name = name
    db.commit()
    db.refresh(report)
    return report


def delete(db: Session, report: Report) -> None:
    db.delete(report)   # tasks.report_id queda en NULL por el ondelete
    db.commit()
