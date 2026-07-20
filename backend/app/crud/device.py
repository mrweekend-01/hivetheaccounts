from sqlalchemy.orm import Session, joinedload
from app.models.device import Device
from app.schemas.device import DeviceCreate, DeviceUpdate


def get(db: Session, device_id: int) -> Device | None:
    return (db.query(Device)
            .options(joinedload(Device.proxies), joinedload(Device.accounts))
            .filter(Device.id == device_id).first())


def list_all(db: Session) -> list[Device]:
    return (db.query(Device)
            .options(joinedload(Device.proxies), joinedload(Device.accounts))
            .order_by(Device.name).all())


def create(db: Session, data: DeviceCreate) -> Device:
    device = Device(**data.model_dump())
    db.add(device)
    db.commit()
    db.refresh(device)
    return device


def update(db: Session, device: Device, data: DeviceUpdate) -> Device:
    for k, v in data.model_dump(exclude_unset=True).items():
        setattr(device, k, v)
    db.commit()
    db.refresh(device)
    return device


def delete(db: Session, device: Device) -> None:
    db.delete(device)
    db.commit()
