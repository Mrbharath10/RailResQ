
from typing import List
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    PROJECT_NAME: str = "RailResQ - Railway Emergency Coordination System"
    VERSION: str = "1.0.0-phase1"
    API_V1_STR: str = "/api"
    ENVIRONMENT: str = "development"

    CORS_ORIGINS: List[str] = [
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://localhost:3000",
        "http://127.0.0.1:3000",
    ]

    DISCLAIMER: str = (
        "Academic Decision-Support Prototype: This system is not connected to "
        "live railway dispatch or emergency services. Human operators must approve consequential actions."
    )

    # Gemini API
    GEMINI_API_KEY: str = ""
    GEMINI_MODEL: str = "gemini-1.5-flash"

    # QRail API
    QRAIL_API_KEY: str = ""
    QRAIL_BASE_URL: str = "https://qrail.in/api/v3"

    # Railway data configuration
    RAILWAY_DATA_MODE: str = "SIMULATED"

    # RailRadar API
    RAILRADAR_API_KEY: str = ""
    RAILRADAR_BASE_URL: str = "https://api.railradar.in/v1"

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore"
    )


settings = Settings()
