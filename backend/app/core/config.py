from pydantic_settings import BaseSettings
from pydantic import Field
import os

class Settings(BaseSettings):
    # Database
    POSTGRES_USER: str = Field(default="wms_user")
    POSTGRES_PASSWORD: str = Field(default="wms_secure_pass_2026")
    POSTGRES_DB: str = Field(default="wms_db")
    POSTGRES_HOST: str = Field(default="postgres")
    POSTGRES_PORT: int = Field(default=5432)
    DATABASE_URL: str = Field(default="postgresql://wms_user:wms_secure_pass_2026@postgres:5432/wms_db")

    # Security
    JWT_SECRET: str = Field(default="super_secret_jwt_key_clothing_wms_2026_change_me")
    JWT_ALGORITHM: str = Field(default="HS256")
    ACCESS_TOKEN_EXPIRE_MINUTES: int = Field(default=30)
    REFRESH_TOKEN_EXPIRE_DAYS: int = Field(default=7)

    # Redis
    REDIS_HOST: str = Field(default="redis")
    REDIS_PORT: int = Field(default=6379)

    # Initial Setup
    INITIAL_ADMIN_EMAIL: str = Field(default="admin@wms.com")
    INITIAL_ADMIN_PASSWORD: str = Field(default="adminpassword")

    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"
        extra = "ignore"

settings = Settings()
