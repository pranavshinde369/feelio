"""
Production configuration for Feelio.
Loads environment variables and validates settings.
"""

import os
from typing import Optional
from dotenv import load_dotenv
import logging

# Load .env file
load_dotenv()

logger = logging.getLogger(__name__)


class Config:
    """Central configuration management."""

    # Gemini API
    GEMINI_API_KEY: str = os.getenv("GEMINI_API_KEY", "").strip()
    MODEL_NAME: str = os.getenv("MODEL_NAME", "gemini-2.5-flash")

    # Application
    APP_ENV: str = os.getenv("APP_ENV", "development")
    DEBUG_MODE: bool = os.getenv("DEBUG_MODE", "False").lower() == "true"
    LOG_LEVEL: str = os.getenv("LOG_LEVEL", "INFO")

    # Audio
    MICROPHONE_INDEX: int = int(os.getenv("MICROPHONE_INDEX", "0"))
    SPEECH_TIMEOUT: int = int(os.getenv("SPEECH_TIMEOUT", "5"))
    SPEECH_PHRASE_LIMIT: int = int(os.getenv("SPEECH_PHRASE_LIMIT", "10"))
    AMBIENT_NOISE_DURATION: int = int(os.getenv("AMBIENT_NOISE_DURATION", "1"))

    # Vision
    CAMERA_INDEX: int = int(os.getenv("CAMERA_INDEX", "0"))
    USE_VISION: bool = os.getenv("USE_VISION", "False").lower() == "true"

    # Model
    RESPONSE_MAX_LENGTH: int = int(os.getenv("RESPONSE_MAX_LENGTH", "3"))

    # Safety
    ENABLE_SAFETY_NET: bool = os.getenv("ENABLE_SAFETY_NET", "True").lower() == "true"
    LOG_SESSIONS: bool = os.getenv("LOG_SESSIONS", "False").lower() == "true"
    SESSION_LOGS_PATH: str = os.getenv("SESSION_LOGS_PATH", "./session_logs/")

    # Output
    TTS_LANGUAGE: str = os.getenv("TTS_LANGUAGE", "en")
    TTS_SLOW_MODE: bool = os.getenv("TTS_SLOW_MODE", "False").lower() == "true"

    @classmethod
    def validate(cls) -> bool:
        """
        Validate critical configuration settings.

        Returns:
            bool: True if valid, raises exception if not.

        Raises:
            ValueError: If critical settings are missing or invalid.
        """
        if not cls.GEMINI_API_KEY:
            raise ValueError(
                "GEMINI_API_KEY is not set. "
                "Please set it in .env or environment variables."
            )

        if cls.MICROPHONE_INDEX < 0:
            raise ValueError("MICROPHONE_INDEX must be >= 0")

        if cls.CAMERA_INDEX < 0:
            raise ValueError("CAMERA_INDEX must be >= 0")

        if cls.SPEECH_TIMEOUT <= 0:
            raise ValueError("SPEECH_TIMEOUT must be > 0")

        logger.info(f"✅ Configuration validated (ENV: {cls.APP_ENV})")
        return True

    @classmethod
    def get_masked_config(cls) -> dict:
        """
        Get configuration dictionary with API keys masked (for logging).

        Returns:
            dict: Configuration with sensitive values masked.
        """
        return {
            "app_env": cls.APP_ENV,
            "debug_mode": cls.DEBUG_MODE,
            "model_name": cls.MODEL_NAME,
            "use_vision": cls.USE_VISION,
            "enable_safety_net": cls.ENABLE_SAFETY_NET,
            "log_sessions": cls.LOG_SESSIONS,
            "gemini_api_key": "***REDACTED***" if cls.GEMINI_API_KEY else "NOT_SET",
        }
