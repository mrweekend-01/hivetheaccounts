from enum import Enum


class Status(str, Enum):
    activo = "activo"
    inactivo = "inactivo"
    suspendido = "suspendido"
    en_revision = "en_revision"


class ProxyStatus(str, Enum):
    operativo = "operativo"      # verde
    inoperativo = "inoperativo"  # rojo, necesita cambiarse


class Platform(str, Enum):
    facebook = "facebook"
    instagram = "instagram"
    tiktok = "tiktok"


class Role(str, Enum):
    admin = "admin"
    editor = "editor"
    operador = "operador"


class HumanizationStatus(str, Enum):
    pendiente = "pendiente"    # estado de arranque
    en_proceso = "en_proceso"  # timer corriendo
    pausado = "pausado"        # morado, timer detenido a mitad de camino
    hecho = "hecho"            # verde, terminó


class PresenceState(str, Enum):
    """Semáforo de redes por cuenta: no existe (rojo) / existe pero sin
    credenciales capturadas todavía (ámbar) / lista con usuario y contraseña (verde)."""
    no_existe = "no_existe"
    pendiente = "pendiente"
    activa = "activa"


class UrgentPriority(str, Enum):
    baja = "baja"
    media = "media"
    alta = "alta"


class UrgentStatus(str, Enum):
    no_arrancada = "no_arrancada"
    en_proceso = "en_proceso"
    finalizada = "finalizada"
