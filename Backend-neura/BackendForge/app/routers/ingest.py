"""
Data ingestion routes for patient forms and file uploads.
Handles initial data collection with validation and normalization.
"""
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Request
from fastapi.responses import JSONResponse
from pydantic import ValidationError
import logging
from typing import List
import uuid
import aiofiles
import os
from pathlib import Path

from app.core.schemas import PatientIntakeSchema, SessionResponse, FileUploadResponse
from app.core.privacy import get_privacy_manager, PrivacyManager
from app.core.exceptions import ValidationException, PrivacyException
from app.core.config import settings

logger = logging.getLogger(__name__)
router = APIRouter()

# Allowed file types for medical documents
ALLOWED_EXTENSIONS = {'.pdf', '.jpg', '.jpeg', '.png', '.tiff', '.tif'}
MAX_FILE_SIZE = 10 * 1024 * 1024  # 10MB

@router.post("/form", response_model=SessionResponse)
async def ingest_form(
    request: Request,
    patient_data: PatientIntakeSchema,
    privacy_manager: PrivacyManager = Depends(get_privacy_manager)
):
    """
    Ingest patient form data with validation and normalization.
    Creates a secure session for further processing.
    
    Args:
        patient_data: Validated patient intake form data
        privacy_manager: Privacy management service
        
    Returns:
        SessionResponse with session_id and normalized data
    """
    request_id = getattr(request.state, 'request_id', 'unknown')
    
    try:
        logger.info(f"Processing form ingestion - RequestID: {request_id}")
        
        # Create secure session
        session_id = await privacy_manager.create_session()
        
        # Calculate derived metrics
        normalized_data = patient_data.dict()
        
        # Calculate BMI if height and weight provided
        if patient_data.height_cm and patient_data.weight_kg:
            height_m = patient_data.height_cm / 100
            normalized_data['bmi'] = round(patient_data.weight_kg / (height_m ** 2), 1)
            
            # BMI categories for risk assessment
            bmi = normalized_data['bmi']
            if bmi < 18.5:
                normalized_data['bmi_category'] = 'underweight'
            elif bmi < 25:
                normalized_data['bmi_category'] = 'normal'
            elif bmi < 30:
                normalized_data['bmi_category'] = 'overweight'
            else:
                normalized_data['bmi_category'] = 'obese'
        
        # Identify risk factors
        risk_factors = []
        
        if patient_data.age >= 65:
            risk_factors.append('advanced_age')
        if patient_data.smoking_status in ['current', 'former']:
            risk_factors.append('smoking_history')
        if normalized_data.get('bmi', 0) >= 30:
            risk_factors.append('obesity')
        if patient_data.family_history_diabetes:
            risk_factors.append('family_diabetes')
        if patient_data.family_history_heart_disease:
            risk_factors.append('family_heart_disease')
        if patient_data.hypertension_history:
            risk_factors.append('hypertension')
        if patient_data.high_cholesterol_history:
            risk_factors.append('high_cholesterol')
            
        normalized_data['identified_risk_factors'] = risk_factors
        normalized_data['risk_factor_count'] = len(risk_factors)
        
        # Store session data
        await privacy_manager.store_session_data(session_id, {
            'patient_data': normalized_data,
            'created_at': privacy_manager._get_current_timestamp(),
            'status': 'form_completed'
        })
        
        logger.info(f"Form ingestion completed - SessionID: {session_id} - RequestID: {request_id}")
        
        return SessionResponse(
            session_id=session_id,
            status="success",
            message="Patient data ingested successfully",
            data=normalized_data
        )
        
    except ValidationError as e:
        logger.error(f"Validation error in form ingestion - RequestID: {request_id} - {e}")
        raise ValidationException(f"Invalid patient data: {e}")
    except Exception as e:
        logger.error(f"Error in form ingestion - RequestID: {request_id} - {e}")
        raise HTTPException(status_code=500, detail="Failed to process patient data")

@router.post("/file", response_model=FileUploadResponse)
async def upload_file(
    request: Request,
    file: UploadFile = File(...),
    session_id: str = None,
    privacy_manager: PrivacyManager = Depends(get_privacy_manager)
):
    """
    Upload medical documents for processing.
    Supports PDF and image formats with security validation.
    
    Args:
        file: Uploaded medical document
        session_id: Active session identifier
        privacy_manager: Privacy management service
        
    Returns:
        FileUploadResponse with file_id and metadata
    """
    request_id = getattr(request.state, 'request_id', 'unknown')
    
    try:
        logger.info(f"Processing file upload - SessionID: {session_id} - RequestID: {request_id}")
        
        # Validate session if provided
        if session_id:
            session_valid = await privacy_manager.validate_session(session_id)
            if not session_valid:
                raise PrivacyException("Invalid or expired session")
        else:
            # Create new session for file-only uploads
            session_id = await privacy_manager.create_session()
        
        # Validate file
        if not file.filename:
            raise ValidationException("No filename provided")
        
        file_extension = Path(file.filename).suffix.lower()
        if file_extension not in ALLOWED_EXTENSIONS:
            raise ValidationException(f"Unsupported file type. Allowed: {', '.join(ALLOWED_EXTENSIONS)}")
        
        # Check file size
        contents = await file.read()
        if len(contents) > MAX_FILE_SIZE:
            raise ValidationException(f"File too large. Maximum size: {MAX_FILE_SIZE // (1024*1024)}MB")
        
        # Reset file pointer
        await file.seek(0)
        
        # Generate unique file ID
        file_id = str(uuid.uuid4())
        
        # Create temporary storage directory
        temp_dir = Path(settings.TEMP_DIR) / session_id
        temp_dir.mkdir(parents=True, exist_ok=True)
        
        # Save file temporarily
        file_path = temp_dir / f"{file_id}{file_extension}"
        
        async with aiofiles.open(file_path, 'wb') as f:
            await f.write(contents)
        
        # Store file metadata
        file_metadata = {
            'file_id': file_id,
            'original_filename': file.filename,
            'file_path': str(file_path),
            'file_size': len(contents),
            'file_type': file.content_type,
            'uploaded_at': privacy_manager._get_current_timestamp(),
            'session_id': session_id
        }
        
        # Update session data
        session_data = await privacy_manager.get_session_data(session_id) or {}
        files = session_data.get('files', [])
        files.append(file_metadata)
        
        await privacy_manager.store_session_data(session_id, {
            **session_data,
            'files': files,
            'status': 'file_uploaded'
        })
        
        # Schedule file cleanup
        await privacy_manager.schedule_file_cleanup(file_path, settings.FILE_TTL_MINUTES * 60)
        
        logger.info(f"File upload completed - FileID: {file_id} - SessionID: {session_id} - RequestID: {request_id}")
        
        return FileUploadResponse(
            file_id=file_id,
            session_id=session_id,
            status="success",
            message="File uploaded successfully",
            filename=file.filename,
            file_size=len(contents),
            file_type=file.content_type
        )
        
    except (ValidationException, PrivacyException):
        raise
    except Exception as e:
        logger.error(f"Error in file upload - SessionID: {session_id} - RequestID: {request_id} - {e}")
        raise HTTPException(status_code=500, detail="Failed to upload file")

@router.get("/session/{session_id}")
async def get_session_info(
    request: Request,
    session_id: str,
    privacy_manager: PrivacyManager = Depends(get_privacy_manager)
):
    """
    Retrieve session information and uploaded files.
    
    Args:
        session_id: Session identifier
        privacy_manager: Privacy management service
        
    Returns:
        Session information and file list
    """
    request_id = getattr(request.state, 'request_id', 'unknown')
    
    try:
        logger.info(f"Retrieving session info - SessionID: {session_id} - RequestID: {request_id}")
        
        # Validate session
        session_valid = await privacy_manager.validate_session(session_id)
        if not session_valid:
            raise PrivacyException("Invalid or expired session")
        
        # Get session data
        session_data = await privacy_manager.get_session_data(session_id)
        if not session_data:
            raise PrivacyException("Session data not found")
        
        # Filter sensitive information
        public_data = {
            'session_id': session_id,
            'status': session_data.get('status', 'unknown'),
            'created_at': session_data.get('created_at'),
            'files': [
                {
                    'file_id': f['file_id'],
                    'filename': f['original_filename'],
                    'file_size': f['file_size'],
                    'file_type': f['file_type'],
                    'uploaded_at': f['uploaded_at']
                }
                for f in session_data.get('files', [])
            ],
            'has_patient_data': 'patient_data' in session_data
        }
        
        return JSONResponse(content=public_data)
        
    except PrivacyException:
        raise
    except Exception as e:
        logger.error(f"Error retrieving session info - SessionID: {session_id} - RequestID: {request_id} - {e}")
        raise HTTPException(status_code=500, detail="Failed to retrieve session information")
