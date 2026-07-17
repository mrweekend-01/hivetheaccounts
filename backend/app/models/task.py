from sqlalchemy import Column, Integer, Text, DateTime
from sqlalchemy.sql import func
from app.core.database import Base


class Task(Base):
    """Una tarea de interacción: un link (publicación) que los perfiles deben
    likear/compartir/comentar. Es una entidad independiente dentro de una
    lista: se crea explícitamente, y se puede reabrir y seguir editando en
    cualquier momento sin importar cuánto avance tenga (no existe el concepto
    de 'archivada' ni el de una única tarea activa)."""
    __tablename__ = "tasks"

    id = Column(Integer, primary_key=True, index=True)
    link = Column(Text, nullable=False, default="")
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    # se actualiza en cada edición (link, toggle de acción, reset): permite
    # ordenar la lista por "trabajada más recientemente"
    updated_at = Column(DateTime(timezone=True), server_default=func.now(),
                        onupdate=func.now())
