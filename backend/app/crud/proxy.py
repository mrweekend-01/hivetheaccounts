from sqlalchemy.orm import Session
from app.models.proxy import Proxy
from app.schemas.proxy import ProxyCreate, ProxyUpdate
from app.core.crypto import encrypt


def get(db: Session, proxy_id: int) -> Proxy | None:
    return db.get(Proxy, proxy_id)


def list_all(db: Session, status: str | None = None) -> list[Proxy]:
    q = db.query(Proxy)
    if status:
        q = q.filter(Proxy.status == status)
    return q.order_by(Proxy.id).all()


def create(db: Session, data: ProxyCreate) -> Proxy:
    payload = data.model_dump(exclude={"password"})
    proxy = Proxy(**payload, password_encrypted=encrypt(data.password))
    db.add(proxy)
    db.commit()
    db.refresh(proxy)
    return proxy


def update(db: Session, proxy: Proxy, data: ProxyUpdate) -> Proxy:
    payload = data.model_dump(exclude_unset=True)
    if "password" in payload:
        proxy.password_encrypted = encrypt(payload.pop("password"))
    for k, v in payload.items():
        setattr(proxy, k, v)
    db.commit()
    db.refresh(proxy)
    return proxy


def delete(db: Session, proxy: Proxy) -> None:
    db.delete(proxy)
    db.commit()
