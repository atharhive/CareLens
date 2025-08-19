"""
Document processing and data extraction routes.
Handles PDF and image processing for lab values and medical information.
"""
from fastapi import APIRouter, Depends, HTTPException, Request
from pydantic import BaseModel
import logging
from typing import Dict, Any, Optional

import uuid

from app.core.privacy import get_privacy_manager, PrivacyManager
from app.core.exceptions import DocumentError, PrivacyException
from app.services.extraction_service import ExtractionService, get_extraction_service
from app.core.schemas import ExtractionResponse

logger = logging.getLogger(__name__)
router = APIRouter()

class ExtractionRequest(BaseModel):
    file_id: str
    session_id: Optional[str] = None
    extraction_type: str = "auto"  # auto, lab_values, text_only
    ocr_language: str = "eng"

@router.post("/file/{file_id}", response_model=ExtractionResponse)
async def extract_document(
    request: Request,
    file_id: str,
    extraction_request: ExtractionRequest = None,
    privacy_manager: PrivacyManager = Depends(get_privacy_manager),
    extraction_service: ExtractionService = Depends(get_extraction_service)
):
    """
    Extract structured data from uploaded medical documents.
    Multi-stage extraction: Camelot → pdfplumber → OCR fallback.

    Args:
        file_id: Unique identifier of uploaded file
        extraction_request: Optional extraction parameters
        privacy_manager: Privacy management service
        extraction_service: Document extraction service

    Returns:
        ExtractionResponse with structured data and confidence scores
    """
    request_id = getattr(request.state, 'request_id', 'unknown')

    try:
        logger.info(f"Processing document extraction - FileID: {file_id} - RequestID: {request_id}")

        # Use provided parameters or defaults
        if extraction_request is None:
            extraction_request = ExtractionRequest(file_id=file_id)

        session_id = extraction_request.session_id

        # Find file in session data
        file_metadata = None
        if session_id:
            session_data = await privacy_manager.get_session_data(session_id)
            if session_data and 'files' in session_data:
                for f in session_data['files']:
                    if f['file_id'] == file_id:
                        file_metadata = f
                        break

        if not file_metadata:
            # Try to find file across all sessions (less efficient but more flexible)
            file_metadata = await privacy_manager.find_file_metadata(file_id)
            if not file_metadata:
                raise DocumentError(f"File not found: {file_id}")

        # Validate session if provided
        if session_id:
            session_valid = await privacy_manager.validate_session(session_id)
            if not session_valid:
                raise PrivacyException("Invalid or expired session")

        # Process document
        extraction_result = await extraction_service.process_document(
            file_path=file_metadata['file_path'],
            file_type=file_metadata.get('file_type', 'application/pdf'),
            extraction_type=extraction_request.extraction_type,
            ocr_language=extraction_request.ocr_language
        )

        # Store extraction results in session
        if session_id:
            session_data = await privacy_manager.get_session_data(session_id) or {}
            extractions = session_data.get('extractions', {})
            extractions[file_id] = {
                'extraction_result': extraction_result,
                'extracted_at': privacy_manager._get_current_timestamp(),
                'extraction_type': extraction_request.extraction_type
            }

            await privacy_manager.store_session_data(session_id, {
                **session_data,
                'extractions': extractions,
                'status': 'extraction_completed'
            })

        logger.info(f"Document extraction completed - FileID: {file_id} - RequestID: {request_id}")

        return ExtractionResponse(
            file_id=file_id,
            session_id=session_id,
            status="success",
            message="Document extracted successfully",
            extraction_data=extraction_result,
            confidence_score=extraction_result.get('overall_confidence', 0.0),
            requires_review=extraction_result.get('requires_manual_review', False)
        )

    except (DocumentError, PrivacyException):
        raise
    except Exception as e:
        logger.error(f"Error in document extraction - FileID: {file_id} - RequestID: {request_id} - {e}")
        raise HTTPException(status_code=500, detail="Failed to extract document data")

@router.get("/file/{file_id}/status")
async def get_extraction_status(
    request: Request,
    file_id: str,
    session_id: str = None,
    privacy_manager: PrivacyManager = Depends(get_privacy_manager)
):
    """
    Get the status of document extraction for a specific file.

    Args:
        file_id: Unique identifier of uploaded file
        session_id: Optional session identifier
        privacy_manager: Privacy management service

    Returns:
        Extraction status and basic metadata
    """
    request_id = getattr(request.state, 'request_id', 'unknown')

    try:
        logger.info(f"Checking extraction status - FileID: {file_id} - RequestID: {request_id}")

        # Validate session if provided
        if session_id:
            session_valid = await privacy_manager.validate_session(session_id)
            if not session_valid:
                raise PrivacyException("Invalid or expired session")

            session_data = await privacy_manager.get_session_data(session_id)
            if not session_data:
                raise PrivacyException("Session data not found")

            # Check if file exists and has extraction data
            extractions = session_data.get('extractions', {})
            if file_id in extractions:
                extraction_info = extractions[file_id]
                return {
                    "file_id": file_id,
                    "status": "completed",
                    "extracted_at": extraction_info.get('extracted_at'),
                    "extraction_type": extraction_info.get('extraction_type'),
                    "has_lab_values": bool(extraction_info.get('extraction_result', {}).get('lab_values')),
                    "confidence_score": extraction_info.get('extraction_result', {}).get('overall_confidence', 0.0),
                    "requires_review": extraction_info.get('extraction_result', {}).get('requires_manual_review', False)
                }

        # Check if file exists but no extraction yet
        file_metadata = await privacy_manager.find_file_metadata(file_id)
        if file_metadata:
            return {
                "file_id": file_id,
                "status": "pending",
                "uploaded_at": file_metadata.get('uploaded_at'),
                "filename": file_metadata.get('original_filename')
            }

        raise DocumentError(f"File not found: {file_id}")

    except (DocumentError, PrivacyException):
        raise
    except Exception as e:
        logger.error(f"Error checking extraction status - FileID: {file_id} - RequestID: {request_id} - {e}")
        raise HTTPException(status_code=500, detail="Failed to check extraction status")

@router.post("/batch")
async def extract_batch_documents(
    request: Request,
    file_ids: list[str],
    session_id: str,
    extraction_type: str = "auto",
    privacy_manager: PrivacyManager = Depends(get_privacy_manager),
    extraction_service: ExtractionService = Depends(get_extraction_service)
):
    """
    Process multiple documents in a single batch operation.
    Useful for processing multiple lab reports or medical documents.

    Args:
        file_ids: List of file identifiers to process
        session_id: Session identifier
        extraction_type: Type of extraction to perform
        privacy_manager: Privacy management service
        extraction_service: Document extraction service

    Returns:
        Batch processing results with individual file status
    """
    request_id = getattr(request.state, 'request_id', 'unknown')

    try:
        logger.info(f"Processing batch extraction - Files: {len(file_ids)} - SessionID: {session_id} - RequestID: {request_id}")

        # Validate session
        session_valid = await privacy_manager.validate_session(session_id)
        if not session_valid:
            raise PrivacyException("Invalid or expired session")

        session_data = await privacy_manager.get_session_data(session_id)
        if not session_data:
            raise PrivacyException("Session data not found")

        results = []
        extractions = session_data.get('extractions', {})

        for file_id in file_ids:
            try:
                # Find file metadata
                file_metadata = None
                for f in session_data.get('files', []):
                    if f['file_id'] == file_id:
                        file_metadata = f
                        break

                if not file_metadata:
                    results.append({
                        "file_id": file_id,
                        "status": "error",
                        "error": "File not found"
                    })
                    continue

                # Process document
                extraction_result = await extraction_service.process_document(
                    file_path=file_metadata['file_path'],
                    file_type=file_metadata.get('file_type', 'application/pdf'),
                    extraction_type=extraction_type,
                    ocr_language="eng"
                )

                # Store results
                extractions[file_id] = {
                    'extraction_result': extraction_result,
                    'extracted_at': privacy_manager._get_current_timestamp(),
                    'extraction_type': extraction_type
                }

                results.append({
                    "file_id": file_id,
                    "status": "success",
                    "confidence_score": extraction_result.get('overall_confidence', 0.0),
                    "requires_review": extraction_result.get('requires_manual_review', False),
                    "lab_values_found": len(extraction_result.get('lab_values', {}))
                })

            except Exception as e:
                logger.error(f"Error processing file {file_id} in batch - {e}")
                results.append({
                    "file_id": file_id,
                    "status": "error",
                    "error": str(e)
                })

        # Update session data
        await privacy_manager.store_session_data(session_id, {
            **session_data,
            'extractions': extractions,
            'status': 'batch_extraction_completed'
        })

        successful = sum(1 for r in results if r['status'] == 'success')
        logger.info(f"Batch extraction completed - Successful: {successful}/{len(file_ids)} - SessionID: {session_id} - RequestID: {request_id}")

        return {
            "batch_id": str(uuid.uuid4()),
            "session_id": session_id,
            "total_files": len(file_ids),
            "successful": successful,
            "results": results,
            "status": "completed"
        }

    except PrivacyException:
        raise
    except Exception as e:
        logger.error(f"Error in batch extraction - SessionID: {session_id} - RequestID: {request_id} - {e}")
        raise HTTPException(status_code=500, detail="Failed to process batch extraction")
