# app/config.py

from pydantic_settings import BaseSettings, SettingsConfigDict
from functools import lru_cache

class Settings(BaseSettings):
    # Default app name
    APP_NAME: str = "Feelio API"
    
    # Current environment (dev, staging, or prod)
    APP_ENV: str = "development"
    
    # REQUIRED: The Google Gemini API Key.
    GEMINI_API_KEY: str
    
    # The URL of your Frontend
    CORS_ORIGINS: str = "http://localhost:3000"

    # --- THE FIX IS HERE ---
    # We add this field so Pydantic knows what to do with 'PORT' from your .env file
    PORT: int = 8000 

    # We use SettingsConfigDict to handle configuration safely
    # extra="ignore" ensures that if you add other random things to .env, the app won't crash
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

@lru_cache()
def get_settings():
    return Settings()