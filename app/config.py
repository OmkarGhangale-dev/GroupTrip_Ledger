from pydantic_settings import BaseSettings, SettingsConfigDict
from functools import lru_cache


class Settings(BaseSettings):
    GOOGLE_CLIENT_ID: str = ""

    # Database
    DATABASE_URL: str

    # Auth — MUST be set to a long random string in production.
    # Generate with: python -c "import secrets; print(secrets.token_hex(32))"
    SECRET_KEY: str = "super-secret-key-change-in-production"

    # CORS — comma-separated list of allowed origins.
    # Set to your Vercel domain in production, e.g.:
    #   ALLOWED_ORIGINS=https://your-app.vercel.app
    # Defaults to wildcard for local development.
    ALLOWED_ORIGINS: str = "*"

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
