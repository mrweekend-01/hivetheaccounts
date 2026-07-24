from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.crud import report as crud
from app.schemas.report import ReportOut, ReportCreate, ReportUpdate
from app.api.deps import get_current_user

router = APIRouter(prefix="/reports", tags=["reports"])


@router.get("", response_model=list[ReportOut])
def list_reports(db: Session = Depends(get_db), _=Depends(get_current_user)):
    return crud.list_all(db)


@router.post("", response_model=ReportOut, status_code=201)
def create_report(data: ReportCreate, db: Session = Depends(get_db),
                  _=Depends(get_current_user)):
    try:
        return crud.create(db, data.name)
    except Exception:
        db.rollback()
        raise HTTPException(400, "Ya existe un informe con ese nombre")


@router.put("/{report_id}", response_model=ReportOut)
def update_report(report_id: int, data: ReportUpdate, db: Session = Depends(get_db),
                  _=Depends(get_current_user)):
    report = crud.get(db, report_id)
    if not report:
        raise HTTPException(404, "Informe no encontrado")
    try:
        return crud.update(db, report, data.name)
    except Exception:
        db.rollback()
        raise HTTPException(400, "Ya existe un informe con ese nombre")


@router.delete("/{report_id}", status_code=204)
def delete_report(report_id: int, db: Session = Depends(get_db),
                  _=Depends(get_current_user)):
    report = crud.get(db, report_id)
    if not report:
        raise HTTPException(404, "Informe no encontrado")
    crud.delete(db, report)
