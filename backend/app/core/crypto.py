"""Cifrado simétrico reversible (Fernet) para credenciales que hay que LEER de vuelta:
correo corporativo, redes sociales y proxy. La clave vive solo en FERNET_KEY (.env)."""
from cryptography.fernet import Fernet, InvalidToken
from app.core.config import settings

_fernet: Fernet | None = None


def _get_fernet() -> Fernet:
    global _fernet
    if _fernet is None:
        if not settings.FERNET_KEY:
            raise RuntimeError(
                "FERNET_KEY no configurada. Genera una con:\n"
                '  python -c "from cryptography.fernet import Fernet; '
                'print(Fernet.generate_key().decode())"'
            )
        _fernet = Fernet(settings.FERNET_KEY.encode())
    return _fernet


def encrypt(plain: str | None) -> str | None:
    if plain is None or plain == "":
        return None
    return _get_fernet().encrypt(plain.encode()).decode()


def decrypt(token: str | None) -> str | None:
    if token is None or token == "":
        return None
    try:
        return _get_fernet().decrypt(token.encode()).decode()
    except InvalidToken:
        return None
