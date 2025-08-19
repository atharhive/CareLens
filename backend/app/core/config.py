"""
Configuration management for the AI Health Risk Assessment Platform.
Environment-based configuration with secure defaults.
"""

import os
from typing import List
from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    """Application settings with environment variable support."""
    
    # Core Settings
    FASTAPI_ENV: str = os.getenv("FASTAPI_ENV", "development")
    DEBUG: bool = os.getenv("DEBUG", "false").lower() == "true"
    SECRET_KEY: str = os.getenv("SECRET_KEY", "your-secret-key-change-in-production")
    
    # CORS and Host Configuration
    ALLOWED_HOSTS: List[str] = ["localhost", "127.0.0.1", "0.0.0.0", "*.replit.dev"]
    CORS_ORIGINS: List[str] = [
        "http://localhost:3000",
        "http://localhost:5000",
        "https://carelens.ai"
    ]
    
    # ML Configuration
    MODEL_REGISTRY_PATH: str = os.getenv("MODEL_REGISTRY_PATH", "/app/ml/models/")
    SHAP_CACHE_SIZE: int = int(os.getenv("SHAP_CACHE_SIZE", "1000"))
    CALIBRATION_METHOD: str = os.getenv("CALIBRATION_METHOD", "isotonic")
    PREDICTION_CONFIDENCE_THRESHOLD: float = 0.7
    
    # Privacy Settings
    SESSION_TTL_MINUTES: int = int(os.getenv("SESSION_TTL_MINUTES", "30"))
    FILE_TTL_MINUTES: int = int(os.getenv("FILE_TTL_MINUTES", "5"))
    SHARE_LINK_MAX_DAYS: int = int(os.getenv("SHARE_LINK_MAX_DAYS", "7"))
    
    # External APIs
    GOOGLE_MAPS_API_KEY: str = os.getenv("GOOGLE_MAPS_API_KEY", "")
    OPENAI_API_KEY: str = os.getenv("OPENAI_API_KEY", "")
    
    # Redis Configuration
    REDIS_URL: str = os.getenv("REDIS_URL", "redis://localhost:6379")
    REDIS_PASSWORD: str = os.getenv("REDIS_PASSWORD", "")
    
    # File Storage
    TEMP_FILE_DIR: str = os.getenv("TEMP_FILE_DIR", "/tmp/health_assessment")
    MAX_FILE_SIZE_MB: int = int(os.getenv("MAX_FILE_SIZE_MB", "50"))
    ALLOWED_FILE_TYPES: List[str] = ["pdf", "jpg", "jpeg", "png"]
    
    # Database Configuration (if needed for future extensions)
    DATABASE_URL: str = os.getenv("DATABASE_URL", "")
    
    # Logging Configuration
    LOG_LEVEL: str = os.getenv("LOG_LEVEL", "INFO")
    LOG_FILE: str = os.getenv("LOG_FILE", "app.log")
    
    # OCR Configuration
    TESSERACT_CMD: str = os.getenv("TESSERACT_CMD", "tesseract")
    OCR_LANGUAGES: List[str] = ["eng", "spa", "fra"]  # English, Spanish, French
    
    # Medical Reference Ranges (for validation)
    MEDICAL_RANGES: dict = {
        "glucose_fasting": {"min": 70, "max": 100, "unit": "mg/dL"},
        "hba1c": {"min": 4.0, "max": 6.5, "unit": "%"},
        "cholesterol_total": {"min": 100, "max": 200, "unit": "mg/dL"},
        "blood_pressure_systolic": {"min": 90, "max": 120, "unit": "mmHg"},
        "blood_pressure_diastolic": {"min": 60, "max": 80, "unit": "mmHg"},
        "bmi": {"min": 18.5, "max": 25.0, "unit": "kg/m²"}
    }
    
    # Triage Configuration
    TRIAGE_THRESHOLDS: dict = {
        "red": {"risk_score": 0.8, "urgency": "immediate"},
        "amber": {"risk_score": 0.5, "urgency": "within_24h"},
        "green": {"risk_score": 0.3, "urgency": "routine"}
    }
    
    # Provider Search Configuration
    PROVIDER_SEARCH_RADIUS_KM: int = int(os.getenv("PROVIDER_SEARCH_RADIUS_KM", "25"))
    MAX_PROVIDERS_RETURNED: int = int(os.getenv("MAX_PROVIDERS_RETURNED", "20"))
    
    # Additional settings from .env file
    SESSION_TTL: int = int(os.getenv("SESSION_TTL", "1800"))
    MODEL_CONFIDENCE_THRESHOLD: float = float(os.getenv("MODEL_CONFIDENCE_THRESHOLD", "0.7"))
    OCR_LANGUAGE: str = os.getenv("OCR_LANGUAGE", "eng")
    GEOCODING_PROVIDER: str = os.getenv("GEOCODING_PROVIDER", "nominatim")
    MAX_PROVIDER_RADIUS_MILES: int = int(os.getenv("MAX_PROVIDER_RADIUS_MILES", "50"))
    DATA_RETENTION_HOURS: float = float(os.getenv("DATA_RETENTION_HOURS", "0.5"))
    ENABLE_AUDIT_LOGGING: bool = os.getenv("ENABLE_AUDIT_LOGGING", "false").lower() == "true"
    ANONYMIZE_LOGS: bool = os.getenv("ANONYMIZE_LOGS", "false").lower() == "true"
    RATE_LIMIT_PER_MINUTE: int = int(os.getenv("RATE_LIMIT_PER_MINUTE", "60"))
    RATE_LIMIT_BURST: int = int(os.getenv("RATE_LIMIT_BURST", "10"))
    
    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"
        case_sensitive = True
        extra = "ignore"  # Ignore extra fields in .env

# Global settings instance
settings = Settings()

# Validation functions
def validate_api_keys():
    """Validate that required API keys are present."""
    missing_keys = []
    
    if not settings.GOOGLE_MAPS_API_KEY:
        missing_keys.append("GOOGLE_MAPS_API_KEY")
    
    if missing_keys:
        raise ValueError(f"Missing required API keys: {', '.join(missing_keys)}")

def get_temp_file_path() -> str:
    """Get and create temporary file directory if it doesn't exist."""
    import os
    temp_dir = settings.TEMP_FILE_DIR
    os.makedirs(temp_dir, exist_ok=True)
    return temp_dir
