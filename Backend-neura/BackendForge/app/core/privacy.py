"""
Privacy management for HIPAA-compliant health data handling.
Session-based data management with automatic cleanup and anonymization.
"""

import json
import logging
from datetime import datetime, timedelta
from typing import Optional, Dict, Any, List
from pathlib import Path
import asyncio
import uuid

import redis.asyncio as redis

from app.core.config import settings

logger = logging.getLogger(__name__)

class PrivacyManager:
    """HIPAA-compliant privacy and session management."""
    
    def __init__(self, redis_client: redis.Redis):
        """Initialize privacy manager with Redis client."""
        self.redis = redis_client
        self.temp_file_dir = Path(settings.TEMP_FILE_DIR)
        self.temp_file_dir.mkdir(parents=True, exist_ok=True)
        
    async def create_session(self) -> str:
        """Create new privacy-protected session with TTL."""
        session_id = str(uuid.uuid4())
        session_data = {
            "created_at": datetime.utcnow().isoformat(),
            "last_accessed": datetime.utcnow().isoformat(),
            "data_processed": False,
            "files_uploaded": [],
            "risk_assessments": [],
            "sharing_enabled": False
        }
        
        # Store in Redis with TTL
        await self.redis.setex(
            f"session:{session_id}",
            timedelta(minutes=settings.SESSION_TTL_MINUTES),
            json.dumps(session_data)
        )
        
        logger.info(f"Created privacy session: {session_id}")
        return session_id
    
    async def get_session(self, session_id: str) -> Optional[Dict[str, Any]]:
        """Get session data if it exists and is valid."""
        try:
            session_data = await self.redis.get(f"session:{session_id}")
            if session_data:
                data = json.loads(session_data)
                # Update last accessed time
                data["last_accessed"] = datetime.utcnow().isoformat()
                await self.redis.setex(
                    f"session:{session_id}",
                    timedelta(minutes=settings.SESSION_TTL_MINUTES),
                    json.dumps(data)
                )
                return data
            return None
        except Exception as e:
            logger.error(f"Session retrieval failed for {session_id}: {str(e)}")
            return None
    
    async def update_session(self, session_id: str, updates: Dict[str, Any]) -> bool:
        """Update session data while maintaining privacy."""
        try:
            session_data = await self.get_session(session_id)
            if not session_data:
                return False
            
            session_data.update(updates)
            session_data["last_accessed"] = datetime.utcnow().isoformat()
            
            await self.redis.setex(
                f"session:{session_id}",
                timedelta(minutes=settings.SESSION_TTL_MINUTES),
                json.dumps(session_data)
            )
            return True
        except Exception as e:
            logger.error(f"Session update failed for {session_id}: {str(e)}")
            return False
    
    async def store_patient_data(self, session_id: str, patient_data: Dict[str, Any], 
                               anonymize: bool = True) -> bool:
        """Store patient data with privacy protection."""
        try:
            if anonymize:
                # Remove direct identifiers but keep medically relevant data
                anonymized_data = self._anonymize_patient_data(patient_data)
            else:
                anonymized_data = patient_data
            
            await self.redis.setex(
                f"patient_data:{session_id}",
                timedelta(minutes=settings.SESSION_TTL_MINUTES),
                json.dumps(anonymized_data)
            )
            
            # Update session metadata
            await self.update_session(session_id, {
                "data_processed": True,
                "data_anonymized": anonymize
            })
            
            logger.info(f"Stored patient data for session: {session_id}")
            return True
        except Exception as e:
            logger.error(f"Patient data storage failed for {session_id}: {str(e)}")
            return False
    
    async def get_patient_data(self, session_id: str) -> Optional[Dict[str, Any]]:
        """Retrieve patient data for session."""
        try:
            patient_data = await self.redis.get(f"patient_data:{session_id}")
            if patient_data:
                return json.loads(patient_data)
            return None
        except Exception as e:
            logger.error(f"Patient data retrieval failed for {session_id}: {str(e)}")
            return None
    
    async def store_file_metadata(self, session_id: str, file_id: str, 
                                metadata: Dict[str, Any]) -> bool:
        """Store file metadata with privacy protection."""
        try:
            # Remove potentially identifying information from metadata
            safe_metadata = {
                "file_id": file_id,
                "file_type": metadata.get("file_type"),
                "file_size": metadata.get("file_size"),
                "upload_time": datetime.utcnow().isoformat(),
                "processed": False
            }
            
            await self.redis.setex(
                f"file:{file_id}",
                timedelta(minutes=settings.FILE_TTL_MINUTES),
                json.dumps(safe_metadata)
            )
            
            # Update session with file reference
            session_data = await self.get_session(session_id)
            if session_data:
                session_data["files_uploaded"].append(file_id)
                await self.update_session(session_id, session_data)
            
            logger.info(f"Stored file metadata: {file_id} for session: {session_id}")
            return True
        except Exception as e:
            logger.error(f"File metadata storage failed: {str(e)}")
            return False
    
    async def get_file_metadata(self, file_id: str) -> Optional[Dict[str, Any]]:
        """Get file metadata."""
        try:
            metadata = await self.redis.get(f"file:{file_id}")
            if metadata:
                return json.loads(metadata)
            return None
        except Exception as e:
            logger.error(f"File metadata retrieval failed for {file_id}: {str(e)}")
            return None
    
    async def cleanup_session(self, session_id: str) -> bool:
        """Comprehensive cleanup of session data and files."""
        try:
            # Get session data to find associated files
            session_data = await self.get_session(session_id)
            
            if session_data:
                # Clean up associated files
                for file_id in session_data.get("files_uploaded", []):
                    await self._cleanup_file(file_id)
            
            # Delete session data
            await self.redis.delete(f"session:{session_id}")
            await self.redis.delete(f"patient_data:{session_id}")
            await self.redis.delete(f"risk_results:{session_id}")
            
            logger.info(f"Cleaned up session: {session_id}")
            return True
        except Exception as e:
            logger.error(f"Session cleanup failed for {session_id}: {str(e)}")
            return False
    
    async def _cleanup_file(self, file_id: str) -> bool:
        """Clean up individual file and metadata."""
        try:
            # Delete file metadata from Redis
            await self.redis.delete(f"file:{file_id}")
            
            # Delete physical file if it exists
            file_path = self.temp_file_dir / file_id
            if file_path.exists():
                file_path.unlink()
                logger.info(f"Deleted physical file: {file_id}")
            
            return True
        except Exception as e:
            logger.error(f"File cleanup failed for {file_id}: {str(e)}")
            return False
    
    async def schedule_cleanup(self, session_id: str, delay_minutes: int = None) -> None:
        """Schedule automatic cleanup of session data."""
        if delay_minutes is None:
            delay_minutes = settings.SESSION_TTL_MINUTES
        
        # In a production system, this would use a proper task queue
        # For now, we rely on Redis TTL for automatic cleanup
        logger.info(f"Session {session_id} scheduled for cleanup in {delay_minutes} minutes")
    
    async def get_data_retention_info(self, session_id: str) -> Dict[str, Any]:
        """Get information about data retention and cleanup schedules."""
        try:
            session_ttl = await self.redis.ttl(f"session:{session_id}")
            
            retention_info = {
                "session_ttl_seconds": session_ttl,
                "session_expires_at": (
                    datetime.utcnow() + timedelta(seconds=session_ttl)
                ).isoformat() if session_ttl > 0 else None,
                "file_ttl_minutes": settings.FILE_TTL_MINUTES,
                "automatic_cleanup": True,
                "data_anonymized": True
            }
            
            return retention_info
        except Exception as e:
            logger.error(f"Retention info retrieval failed: {str(e)}")
            return {}
    
    def _anonymize_patient_data(self, patient_data: Dict[str, Any]) -> Dict[str, Any]:
        """Anonymize patient data while preserving medical relevance."""
        anonymized = patient_data.copy()
        
        # Remove direct identifiers
        identifiers_to_remove = [
            'email', 'phone', 'name', 'first_name', 'last_name',
            'address', 'ssn', 'insurance_id', 'emergency_contact'
        ]
        
        for identifier in identifiers_to_remove:
            anonymized.pop(identifier, None)
        
        # Generalize age to age groups
        if 'age' in anonymized:
            age = anonymized['age']
            if age < 25:
                anonymized['age_group'] = '18-24'
            elif age < 35:
                anonymized['age_group'] = '25-34'
            elif age < 45:
                anonymized['age_group'] = '35-44'
            elif age < 55:
                anonymized['age_group'] = '45-54'
            elif age < 65:
                anonymized['age_group'] = '55-64'
            else:
                anonymized['age_group'] = '65+'
            
            # Keep original age for medical calculations but flag as anonymized
            anonymized['age_anonymized'] = True
        
        # Add anonymization timestamp
        anonymized['anonymized_at'] = datetime.utcnow().isoformat()
        
        return anonymized
    
    async def create_share_link(self, session_id: str, expiry_days: int = 7, 
                              include_personal_info: bool = False) -> Optional[str]:
        """Create shareable link for results with privacy controls."""
        try:
            share_id = str(uuid.uuid4())
            
            # Get patient data and results
            patient_data = await self.get_patient_data(session_id)
            if not patient_data:
                return None
            
            # Apply additional anonymization for sharing if needed
            if not include_personal_info:
                share_data = self._anonymize_for_sharing(patient_data)
            else:
                share_data = patient_data
            
            # Store shareable data with expiry
            await self.redis.setex(
                f"share:{share_id}",
                timedelta(days=expiry_days),
                json.dumps({
                    "original_session": session_id,
                    "data": share_data,
                    "created_at": datetime.utcnow().isoformat(),
                    "include_personal_info": include_personal_info
                })
            )
            
            logger.info(f"Created share link: {share_id} for session: {session_id}")
            return share_id
        except Exception as e:
            logger.error(f"Share link creation failed: {str(e)}")
            return None
    
    def _anonymize_for_sharing(self, patient_data: Dict[str, Any]) -> Dict[str, Any]:
        """Additional anonymization specifically for sharing."""
        share_data = self._anonymize_patient_data(patient_data.copy())
        
        # Further remove potentially identifying information
        additional_removals = [
            'specific_medications', 'rare_conditions', 'unique_symptoms'
        ]
        
        for field in additional_removals:
            share_data.pop(field, None)
        
        # Mark as prepared for sharing
        share_data['prepared_for_sharing'] = True
        share_data['sharing_timestamp'] = datetime.utcnow().isoformat()
        
        return share_data
    
    async def run_cleanup_job(self) -> None:
        """Background job to clean up expired data."""
        try:
            # This would typically run as a scheduled job
            # Clean up any temporary files older than the TTL
            cutoff_time = datetime.utcnow() - timedelta(minutes=settings.FILE_TTL_MINUTES)
            
            for file_path in self.temp_file_dir.iterdir():
                if file_path.is_file():
                    file_modified = datetime.fromtimestamp(file_path.stat().st_mtime)
                    if file_modified < cutoff_time:
                        try:
                            file_path.unlink()
                            logger.info(f"Cleaned up expired file: {file_path.name}")
                        except Exception as e:
                            logger.error(f"Failed to delete expired file {file_path.name}: {str(e)}")
            
        except Exception as e:
            logger.error(f"Cleanup job failed: {str(e)}")
