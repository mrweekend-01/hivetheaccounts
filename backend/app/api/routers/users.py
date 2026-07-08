from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.core.enums import Role
from app.crud import user as crud
from app.schemas.user import UserOut, UserCreate, UserUpdate
from app.api.deps import require_roles

router = APIRouter(prefix="/users", tags=["users"])


@router.get("", response_model=list[UserOut])
def list_users(db: Session = Depends(get_db), _=Depends(require_roles(Role.admin))):
    return crud.list_all(db)


@router.post("", response_model=UserOut, status_code=201)
def create_user(data: UserCreate, db: Session = Depends(get_db),
                _=Depends(require_roles(Role.admin))):
    if crud.get_by_username(db, data.username):
        raise HTTPException(400, "El usuario ya existe")
    return crud.create(db, data)


@router.put("/{user_id}", response_model=UserOut)
def update_user(user_id: int, data: UserUpdate, db: Session = Depends(get_db),
                _=Depends(require_roles(Role.admin))):
    u = crud.get(db, user_id)
    if not u:
        raise HTTPException(404, "Usuario no encontrado")
    return crud.update(db, u, data)


@router.delete("/{user_id}", status_code=204)
def delete_user(user_id: int, db: Session = Depends(get_db),
                _=Depends(require_roles(Role.admin))):
    u = crud.get(db, user_id)
    if not u:
        raise HTTPException(404, "Usuario no encontrado")
    crud.delete(db, u)
