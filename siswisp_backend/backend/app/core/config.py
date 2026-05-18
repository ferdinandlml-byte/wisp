from pydantic import BaseSettings
from functools import lru_cache
import os


class Settings(BaseSettings):
    # App
    APP_NAME: str = "SISWISP"
    DEBUG: bool = False

    # Base de datos
    # PostgreSQL en producción (Railway), SQLite localmente
    DATABASE_URL: str = os.getenv(
        "DATABASE_URL",
        "postgresql://postgres:postgres@localhost:5432/siswisp"  # Para desarrollo local con Docker Compose
    )
    
    # Si no hay DATABASE_URL y no estamos en producción, usar SQLite
    if not os.getenv("DATABASE_URL") and not os.getenv("RAILWAY_ENVIRONMENT"):
        DATABASE_URL = "sqlite:///./test.db"

    # Redis / Celery
    REDIS_URL: str = "redis://localhost:6379/0"

    # JWT
    SECRET_KEY: str = os.getenv("SECRET_KEY", "dev-secret-key-change-in-production")
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 1440  # 24 horas

    # MikroTik
    MIKROTIK_HOST: str = ""
    MIKROTIK_USER: str = "admin"
    MIKROTIK_PASSWORD: str = ""

    # WhatsApp - Evolution API
    EVOLUTION_API_URL: str = ""
    EVOLUTION_API_KEY: str = ""
    EVOLUTION_INSTANCE: str = "siswisp"

    class Config:
        env_file = ".env"


@lru_cache()
def get_settings() -> Settings:
    return Settings()


settings = get_settings()
