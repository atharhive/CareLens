"""
Core package for the AI Health Risk Assessment Platform.
Contains configuration, security, privacy, and schema definitions.
"""

from .config import settings
from .privacy import PrivacyManager

__all__ = ["settings", "PrivacyManager"]
