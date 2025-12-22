from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    PROJECT_NAME: str = "TaskForge API"

    # Database
    DATABASE_URL: str = "sqlite:///./taskforge.db"

    # JWT
    JWT_SECRET_KEY: str = "CHANGE_ME_IN_PROD"
    JWT_ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60


settings = Settings()
