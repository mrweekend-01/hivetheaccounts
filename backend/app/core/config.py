from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    DATABASE_URL: str = "postgresql://hth:cambia_esto@localhost:5432/hth_accounts"
    SECRET_KEY: str = "dev-secret-cambia-esto"
    FERNET_KEY: str = ""  # obligatorio en prod; ver .env.example
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 480
    HUMANIZATION_MINUTES: int = 30
    CORS_ORIGINS: str = "http://localhost:5173"

    # Usuario admin sembrado al iniciar (cámbialo tras el primer login)
    FIRST_ADMIN_USER: str = "alvaro"
    FIRST_ADMIN_PASSWORD: str = "admin123"

    @property
    def cors_list(self) -> list[str]:
        return [o.strip() for o in self.CORS_ORIGINS.split(",") if o.strip()]


settings = Settings()
