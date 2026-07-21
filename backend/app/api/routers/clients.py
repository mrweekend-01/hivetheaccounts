from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.crud import client as crud
from app.schemas.client import ClientOut, ClientCreate
from app.api.deps import get_current_user

router = APIRouter(prefix="/clients", tags=["clients"])


@router.get("", response_model=list[ClientOut])
def list_clients(db: Session = Depends(get_db), _=Depends(get_current_user)):
    return crud.list_all(db)


@router.post("", response_model=ClientOut, status_code=201)
def create_client(data: ClientCreate, db: Session = Depends(get_db),
                  _=Depends(get_current_user)):
    try:
        return crud.create(db, data.name)
    except Exception:
        db.rollback()
        raise HTTPException(400, "Ya existe un cliente con ese nombre")


@router.delete("/{client_id}", status_code=204)
def delete_client(client_id: int, db: Session = Depends(get_db),
                  _=Depends(get_current_user)):
    client = crud.get(db, client_id)
    if not client:
        raise HTTPException(404, "Cliente no encontrado")
    crud.delete(db, client)
