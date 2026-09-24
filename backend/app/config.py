import os
from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    PROJECT_NAME: str = "FlowTwin AI: Predictive Digital Workflow Optimization"
    DATABASE_URL: str = os.getenv("DATABASE_URL", "sqlite:///./flowtwin.db")
    DEBUG: bool = os.getenv("DEBUG", "True").lower() == "true"
    CORS_ORIGINS: list[str] = ["*"]

    class Config:
        env_file = ".env"

settings = Settings()
