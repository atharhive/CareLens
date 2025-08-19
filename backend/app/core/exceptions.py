"""
Custom exceptions for the AI Health Risk Assessment Platform.
Provides structured error handling with appropriate HTTP status codes.
"""

from fastapi import HTTPException
from typing import Any, Dict, Optional


class BaseHealthException(HTTPException):
    """Base exception class for all health platform exceptions."""
    
    def __init__(
        self,
        status_code: int = 500,
        detail: str = "Internal server error",
        headers: Optional[Dict[str, Any]] = None,
        error_code: str = "UNKNOWN_ERROR"
    ):
        super().__init__(status_code=status_code, detail=detail, headers=headers)
        self.error_code = error_code


class ValidationException(BaseHealthException):
    """Raised when request data validation fails."""
    
    def __init__(self, detail: str = "Invalid request data", field: str = None):
        super().__init__(
            status_code=400,
            detail=detail,
            error_code="VALIDATION_ERROR"
        )
        self.field = field


class ModelException(BaseHealthException):
    """Raised when ML model processing fails."""
    
    def __init__(self, detail: str = "Model processing failed", model_name: str = None):
        super().__init__(
            status_code=500,
            detail=detail,
            error_code="MODEL_ERROR"
        )
        self.model_name = model_name


class DocumentError(BaseHealthException):
    """Raised when document processing fails."""
    
    def __init__(self, detail: str = "Document processing failed", file_type: str = None):
        super().__init__(
            status_code=422,
            detail=detail,
            error_code="DOCUMENT_ERROR"
        )
        self.file_type = file_type


class PrivacyException(BaseHealthException):
    """Raised when privacy or session management fails."""
    
    def __init__(self, detail: str = "Privacy violation or session error"):
        super().__init__(
            status_code=403,
            detail=detail,
            error_code="PRIVACY_ERROR"
        )


class SessionExpiredException(PrivacyException):
    """Raised when session has expired."""
    
    def __init__(self, session_id: str = None):
        detail = f"Session expired: {session_id}" if session_id else "Session expired"
        super().__init__(detail=detail)
        self.error_code = "SESSION_EXPIRED"


class FileUploadException(BaseHealthException):
    """Raised when file upload fails."""
    
    def __init__(self, detail: str = "File upload failed", filename: str = None):
        super().__init__(
            status_code=400,
            detail=detail,
            error_code="FILE_UPLOAD_ERROR"
        )
        self.filename = filename


class ExternalAPIException(BaseHealthException):
    """Raised when external API calls fail."""
    
    def __init__(self, detail: str = "External API error", api_name: str = None):
        super().__init__(
            status_code=502,
            detail=detail,
            error_code="EXTERNAL_API_ERROR"
        )
        self.api_name = api_name


class RateLimitException(BaseHealthException):
    """Raised when rate limits are exceeded."""
    
    def __init__(self, detail: str = "Rate limit exceeded"):
        super().__init__(
            status_code=429,
            detail=detail,
            error_code="RATE_LIMIT_EXCEEDED"
        )


class DatabaseException(BaseHealthException):
    """Raised when database operations fail."""
    
    def __init__(self, detail: str = "Database operation failed"):
        super().__init__(
            status_code=500,
            detail=detail,
            error_code="DATABASE_ERROR"
        )
