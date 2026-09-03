from pydantic_settings import BaseSettings, SettingsConfigDict
from functools import lru_cache


class Settings(BaseSettings):
    # Database
    DATABASE_URL: str = "sqlite+aiosqlite:///./grouptrip.db"

    # AI
    GEMINI_API_KEY: str = ""

    # Maps
    GOOGLE_MAPS_API_KEY: str = ""

    # Email
    EMAIL_API_KEY: str = ""

    # App
    APP_NAME: str = "GroupTrip Ledger"
    APP_VERSION: str = "1.0.0"
    DEBUG: bool = False

    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8", extra="ignore")


@lru_cache()
def get_settings() -> Settings:
    return Settings()


settings = get_settings()
