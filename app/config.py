from pydantic_settings import BaseSettings, SettingsConfigDict
from functools import lru_cache


class Settings(BaseSettings):
    # Google Auth (Accepts either backend or Vercel frontend variable name)
    GOOGLE_CLIENT_ID: str = ""
    VITE_GOOGLE_CLIENT_ID: str = ""
    GOOGLE_CLIENT_SECRET: str = ""

    # Database
    DATABASE_URL: str = "postgresql+asyncpg://neondb_owner:npg_EZDL2NKuPFR3@ep-damp-sun-b3qb1oml-pooler.c-4.ap-southeast-1.aws.neon.tech/neondb"

    # Auth — JWT signing secret
    SECRET_KEY: str = "super-secret-key-change-in-production"

    # CORS — comma-separated list of allowed origins.
    # Set to your Vercel domain in production, e.g.:
    #   ALLOWED_ORIGINS=https://your-app.vercel.app
    # Defaults to wildcard for local development.
    ALLOWED_ORIGINS: str = "*"

    # AI Keys
    GEMINI_API_KEY: str = ""
    GROQ_API_KEY: str = ""
    VITE_GROQ_API_KEY: str = ""

    # Maps Keys
    GOOGLE_MAPS_API_KEY: str = ""
    VITE_GOOGLE_MAPS_API_KEY: str = ""

    # Email Keys
    EMAIL_API_KEY: str = ""
    RESEND_API_KEY: str = ""
    SMTP_HOST: str = ""
    SMTP_PORT: int = 587
    SMTP_USER: str = ""
    SMTP_PASSWORD: str = ""
    EMAIL_FROM: str = ""

    # App
    APP_NAME: str = "GroupTrip Ledger"
    APP_VERSION: str = "1.0.0"
    DEBUG: bool = False

    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8", extra="ignore")

    @property
    def effective_google_client_id(self) -> str:
        return self.GOOGLE_CLIENT_ID or self.VITE_GOOGLE_CLIENT_ID

    @property
    def effective_google_maps_api_key(self) -> str:
        return self.GOOGLE_MAPS_API_KEY or self.VITE_GOOGLE_MAPS_API_KEY

    @property
    def effective_groq_api_key(self) -> str:
        return self.GROQ_API_KEY or self.VITE_GROQ_API_KEY


@lru_cache()
def get_settings() -> Settings:
    return Settings()


settings = get_settings()
