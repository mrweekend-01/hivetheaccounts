from sqlalchemy.orm import Session
from app.models.client import Client


def list_all(db: Session) -> list[Client]:
    return db.query(Client).order_by(Client.name).all()


def get(db: Session, client_id: int) -> Client | None:
    return db.query(Client).filter(Client.id == client_id).first()


def create(db: Session, name: str) -> Client:
    client = Client(name=name)
    db.add(client)
    db.commit()
    db.refresh(client)
    return client


def delete(db: Session, client: Client) -> None:
    db.delete(client)   # tasks.client_id queda en NULL por el ondelete
    db.commit()
