"""
Test suite for the AI Health Risk Assessment Platform.
Comprehensive testing for endpoints, ML models, and core functionality.
"""

import os
import sys
import pytest
import asyncio
from pathlib import Path

# Add the app directory to Python path for imports
app_dir = Path(__file__).parent.parent
sys.path.insert(0, str(app_dir))

# Test configuration
TEST_CONFIG = {
    "FASTAPI_ENV": "testing",
    "DEBUG": True,
    "REDIS_URL": "redis://localhost:6379/1",  # Use test database
    "MODEL_REGISTRY_PATH": str(app_dir / "tests" / "test_models"),
    "TEMP_FILE_DIR": str(app_dir / "tests" / "temp_files"),
    "SECRET_KEY": "test-secret-key",
    "GOOGLE_MAPS_API_KEY": "test-api-key"
}

# Set test environment variables
for key, value in TEST_CONFIG.items():
    os.environ[key] = value

# Create test directories
test_dirs = [
    Path(TEST_CONFIG["MODEL_REGISTRY_PATH"]),
    Path(TEST_CONFIG["TEMP_FILE_DIR"])
]

for test_dir in test_dirs:
    test_dir.mkdir(parents=True, exist_ok=True)

# Pytest configuration
def pytest_configure(config):
    """Pytest configuration."""
    # Set asyncio event loop policy for Windows compatibility
    if sys.platform.startswith('win'):
        asyncio.set_event_loop_policy(asyncio.WindowsProactorEventLoopPolicy())

@pytest.fixture(scope="session")
def event_loop():
    """Create an instance of the default event loop for the test session."""
    loop = asyncio.get_event_loop_policy().new_event_loop()
    yield loop
    loop.close()

# Test utilities
class TestUtils:
    """Utility functions for testing."""
    
    @staticmethod
    def create_test_patient_data():
        """Create sample patient data for testing."""
        return {
            "age": 45,
            "gender": "male",
            "ethnicity": "non_hispanic",
            "race": "white",
            "vital_signs": {
                "height_cm": 175.0,
                "weight_kg": 80.0,
                "blood_pressure_systolic": 130,
                "blood_pressure_diastolic": 85,
                "heart_rate": 72,
                "temperature_celsius": 36.5
            },
            "medical_history": {
                "conditions": ["hypertension"],
                "medications": ["lisinopril"],
                "allergies": [],
                "surgeries": [],
                "family_history": ["diabetes", "heart_disease"],
                "smoking_status": "never",
                "alcohol_consumption": "moderate"
            },
            "lifestyle_factors": {
                "exercise_frequency": "3 times per week",
                "diet_type": "balanced",
                "stress_level": 5,
                "sleep_hours": 7.5,
                "occupation": "office worker"
            },
            "symptoms": {
                "primary_complaint": "routine checkup",
                "symptoms_list": [],
                "symptom_duration": "none",
                "pain_level": 0
            }
        }
    
    @staticmethod
    def create_test_lab_values():
        """Create sample lab values for testing."""
        return [
            {
                "test_name": "glucose_fasting",
                "value": 95.0,
                "unit": "mg/dL",
                "reference_range": "70-100 mg/dL",
                "confidence": 0.9,
                "is_abnormal": False
            },
            {
                "test_name": "hba1c",
                "value": 5.8,
                "unit": "%",
                "reference_range": "4.0-5.6 %",
                "confidence": 0.85,
                "is_abnormal": True
            },
            {
                "test_name": "cholesterol_total",
                "value": 220.0,
                "unit": "mg/dL",
                "reference_range": "0-200 mg/dL",
                "confidence": 0.92,
                "is_abnormal": True
            }
        ]
    
    @staticmethod
    def create_test_risk_scores():
        """Create sample risk scores for testing."""
        return [
            {
                "condition": "diabetes",
                "risk_score": 0.65,
                "confidence_interval": {"lower": 0.55, "upper": 0.75},
                "risk_level": "moderate",
                "model_version": "ensemble_v1.0.0"
            },
            {
                "condition": "heart_disease",
                "risk_score": 0.45,
                "confidence_interval": {"lower": 0.35, "upper": 0.55},
                "risk_level": "moderate",
                "model_version": "ensemble_v1.0.0"
            }
        ]

# Export test utilities
__all__ = ["TestUtils", "TEST_CONFIG"]
