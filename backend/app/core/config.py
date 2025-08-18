import os
from typing import List, Optional
from dotenv import load_dotenv

load_dotenv()

def _split_csv(value: Optional[str]) -> List[str]:
    if not value:
        return []
    return [v.strip() for v in value.split(",") if v.strip()]

class Settings:
    # API
    API_HOST: str = os.getenv("API_HOST", "0.0.0.0")
    API_PORT: int = int(os.getenv("API_PORT", "8000"))
    LOG_LEVEL: str = os.getenv("LOG_LEVEL", "info")

    # DB
    DB_HOST: str = os.getenv("DB_HOST", "localhost")  # in Docker this should be "db"
    DB_PORT: int = int(os.getenv("DB_PORT", "5432"))
    DB_USER: str = os.getenv("DB_USER", "postgres")
    DB_PASSWORD: str = os.getenv("DB_PASSWORD", "postgres")
    DB_NAME: str = os.getenv("DB_NAME", "books")

    CORS_ORIGINS: List[str] = _split_csv(os.getenv("CORS_ORIGINS", "http://localhost:8080"))

    @property
    def SYNC_DATABASE_URL(self) -> str:
        """Sync SQLAlchemy URL (psycopg2) — use for Alembic and regular blocking sessions."""
        return (
            f"postgresql+psycopg2://{self.DB_USER}:{self.DB_PASSWORD}"
            f"@{self.DB_HOST}:{self.DB_PORT}/{self.DB_NAME}"
        )

    @property
    def ASYNC_DATABASE_URL(self) -> str:
        """Async SQLAlchemy URL (asyncpg) — if you ever add async engine usage."""
        return (
            f"postgresql+asyncpg://{self.DB_USER}:{self.DB_PASSWORD}"
            f"@{self.DB_HOST}:{self.DB_PORT}/{self.DB_NAME}"
        )

    @property
    def SQLALCHEMY_DATABASE_URI(self) -> str:
        """Alias so existing Alembic env.py code (settings.SQLALCHEMY_DATABASE_URI) keeps working."""
        return self.SYNC_DATABASE_URL

settings = Settings()
