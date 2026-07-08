from fastapi import APIRouter, Depends
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.crud import account as crud
from app.utils import export as exporter
from app.api.deps import get_current_user

router = APIRouter(prefix="/export", tags=["export"])


@router.get("/accounts.csv")
def export_csv(platform: str | None = None, status: str | None = None,
               device_id: int | None = None, search: str | None = None,
               db: Session = Depends(get_db), _=Depends(get_current_user)):
    rows = crud.list_accounts(db, platform=platform, status=status,
                              device_id=device_id, search=search)
    buf = exporter.to_csv(rows)
    return StreamingResponse(
        buf, media_type="text/csv",
        headers={"Content-Disposition": "attachment; filename=cuentas.csv"})


@router.get("/accounts.xlsx")
def export_xlsx(platform: str | None = None, status: str | None = None,
                device_id: int | None = None, search: str | None = None,
                db: Session = Depends(get_db), _=Depends(get_current_user)):
    rows = crud.list_accounts(db, platform=platform, status=status,
                              device_id=device_id, search=search)
    buf = exporter.to_xlsx(rows)
    return StreamingResponse(
        buf,
        media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        headers={"Content-Disposition": "attachment; filename=cuentas.xlsx"})
