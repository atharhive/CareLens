"""
Security management for the AI Health Risk Assessment Platform.
Medical-grade security with encryption, authentication, and audit logging.
"""

import hashlib
import hmac
import secrets
import logging
from datetime import datetime, timedelta
from typing import Optional, Dict, Any
from pathlib import Path

from passlib.context import CryptContext
from jose import JWTError, jwt
from cryptography.fernet import Fernet
from cryptography.hazmat.primitives import hashes
from cryptography.hazmat.primitives.kdf.pbkdf2 import PBKDF2HMAC
import base64

from app.core.config import settings

logger = logging.getLogger(__name__)

class SecurityManager:
    """Comprehensive security manager for medical data protection."""
    
    def __init__(self):
        """Initialize security components."""
        self.pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
        self.encryption_key = self._get_or_create_encryption_key()
        self.fernet = Fernet(self.encryption_key)
        
    def _get_or_create_encryption_key(self) -> bytes:
        """Get or create encryption key for data protection."""
        # In production, this should be loaded from secure key management
        key_material = settings.SECRET_KEY.encode()
        kdf = PBKDF2HMAC(
            algorithm=hashes.SHA256(),
            length=32,
            salt=b'health_assessment_salt',  # Use proper random salt in production
            iterations=100000,
        )
        key = base64.urlsafe_b64encode(kdf.derive(key_material))
        return key
    
    def hash_password(self, password: str) -> str:
        """Hash password using bcrypt."""
        return self.pwd_context.hash(password)
    
    def verify_password(self, plain_password: str, hashed_password: str) -> bool:
        """Verify password against hash."""
        return self.pwd_context.verify(plain_password, hashed_password)
    
    def create_access_token(self, data: Dict[str, Any], expires_delta: Optional[timedelta] = None) -> str:
        """Create JWT access token."""
        to_encode = data.copy()
        
        if expires_delta:
            expire = datetime.utcnow() + expires_delta
        else:
            expire = datetime.utcnow() + timedelta(minutes=settings.SESSION_TTL_MINUTES)
            
        to_encode.update({"exp": expire})
        
        try:
            encoded_jwt = jwt.encode(to_encode, settings.SECRET_KEY, algorithm="HS256")
            return encoded_jwt
        except Exception as e:
            logger.error(f"Token creation failed: {str(e)}")
            raise
    
    def verify_token(self, token: str) -> Dict[str, Any]:
        """Verify and decode JWT token."""
        try:
            payload = jwt.decode(token, settings.SECRET_KEY, algorithms=["HS256"])
            return payload
        except JWTError as e:
            logger.warning(f"Token verification failed: {str(e)}")
            raise
    
    def encrypt_sensitive_data(self, data: str) -> str:
        """Encrypt sensitive data using Fernet encryption."""
        try:
            encrypted_data = self.fernet.encrypt(data.encode())
            return base64.urlsafe_b64encode(encrypted_data).decode()
        except Exception as e:
            logger.error(f"Encryption failed: {str(e)}")
            raise
    
    def decrypt_sensitive_data(self, encrypted_data: str) -> str:
        """Decrypt sensitive data."""
        try:
            decoded_data = base64.urlsafe_b64decode(encrypted_data.encode())
            decrypted_data = self.fernet.decrypt(decoded_data)
            return decrypted_data.decode()
        except Exception as e:
            logger.error(f"Decryption failed: {str(e)}")
            raise
    
    def generate_secure_id(self, length: int = 32) -> str:
        """Generate cryptographically secure random ID."""
        return secrets.token_urlsafe(length)
    
    def generate_file_hash(self, file_path: Path) -> str:
        """Generate SHA-256 hash of file for integrity checking."""
        hash_sha256 = hashlib.sha256()
        try:
            with open(file_path, "rb") as f:
                for chunk in iter(lambda: f.read(4096), b""):
                    hash_sha256.update(chunk)
            return hash_sha256.hexdigest()
        except Exception as e:
            logger.error(f"File hashing failed: {str(e)}")
            raise
    
    def verify_file_integrity(self, file_path: Path, expected_hash: str) -> bool:
        """Verify file integrity using SHA-256 hash."""
        try:
            actual_hash = self.generate_file_hash(file_path)
            return hmac.compare_digest(expected_hash, actual_hash)
        except Exception as e:
            logger.error(f"File integrity verification failed: {str(e)}")
            return False
    
    def sanitize_filename(self, filename: str) -> str:
        """Sanitize filename to prevent directory traversal attacks."""
        # Remove any path separators and potentially dangerous characters
        import re
        import os
        
        # Get just the filename without path
        filename = os.path.basename(filename)
        
        # Remove or replace dangerous characters
        filename = re.sub(r'[<>:"/\\|?*]', '_', filename)
        
        # Limit length
        if len(filename) > 255:
            name, ext = os.path.splitext(filename)
            filename = name[:255-len(ext)] + ext
            
        return filename
    
    def log_security_event(self, event_type: str, details: Dict[str, Any], 
                          request_id: Optional[str] = None):
        """Log security events for audit purposes."""
        security_log = {
            "timestamp": datetime.utcnow().isoformat(),
            "event_type": event_type,
            "request_id": request_id,
            "details": details
        }
        
        # In production, send to secure logging system
        logger.warning(f"Security Event: {security_log}")
    
    def validate_file_type(self, filename: str, content_type: str) -> bool:
        """Validate file type against allowed types."""
        allowed_extensions = settings.ALLOWED_FILE_TYPES
        allowed_mime_types = {
            'pdf': ['application/pdf'],
            'jpg': ['image/jpeg'],
            'jpeg': ['image/jpeg'],
            'png': ['image/png']
        }
        
        # Check file extension
        file_extension = filename.lower().split('.')[-1]
        if file_extension not in allowed_extensions:
            return False
        
        # Check MIME type
        if file_extension in allowed_mime_types:
            if content_type not in allowed_mime_types[file_extension]:
                return False
        
        return True
    
    def create_share_token(self, session_id: str, expires_in_days: int = 7) -> str:
        """Create secure token for sharing results."""
        data = {
            "session_id": session_id,
            "share_type": "results",
            "created_at": datetime.utcnow().isoformat()
        }
        
        expires_delta = timedelta(days=expires_in_days)
        return self.create_access_token(data, expires_delta)
    
    def verify_share_token(self, token: str) -> Optional[str]:
        """Verify share token and return session ID."""
        try:
            payload = self.verify_token(token)
            if payload.get("share_type") == "results":
                return payload.get("session_id")
            return None
        except JWTError:
            return None
    
    def anonymize_patient_data(self, patient_data: Dict[str, Any]) -> Dict[str, Any]:
        """Anonymize patient data for sharing/analysis."""
        anonymized_data = patient_data.copy()
        
        # Remove direct identifiers
        sensitive_fields = [
            'email', 'phone', 'name', 'address', 'ssn', 
            'emergency_contact', 'insurance_id'
        ]
        
        for field in sensitive_fields:
            if field in anonymized_data:
                del anonymized_data[field]
        
        # Age generalization (group into ranges)
        if 'age' in anonymized_data:
            age = anonymized_data['age']
            if age < 18:
                anonymized_data['age_group'] = 'under_18'
            elif age < 30:
                anonymized_data['age_group'] = '18-29'
            elif age < 50:
                anonymized_data['age_group'] = '30-49'
            elif age < 65:
                anonymized_data['age_group'] = '50-64'
            else:
                anonymized_data['age_group'] = '65_plus'
            del anonymized_data['age']
        
        return anonymized_data
    
    def check_rate_limit(self, identifier: str, max_requests: int = 100, 
                        time_window: int = 3600) -> bool:
        """Check if request is within rate limits (simplified implementation)."""
        # In production, implement with Redis or similar
        # This is a placeholder implementation
        return True
    
    def audit_data_access(self, session_id: str, access_type: str, 
                         user_agent: Optional[str] = None):
        """Audit data access for compliance."""
        audit_event = {
            "session_id": session_id,
            "access_type": access_type,
            "user_agent": user_agent,
            "ip_address": "redacted",  # Would get from request in real implementation
            "timestamp": datetime.utcnow().isoformat()
        }
        
        # Log audit event
        logger.info(f"Data Access Audit: {audit_event}")
        
        # In production, store in secure audit database
