"""
ML-powered risk detection routes.
Handles ensemble model inference for multiple health conditions.
"""
from fastapi import APIRouter, Depends, HTTPException, Request
from pydantic import BaseModel, Field
from typing import List, Dict, Any, Optional
import logging

from app.core.privacy import get_privacy_manager, PrivacyManager
from app.core.exceptions import ModelException, ValidationException, PrivacyException
from app.services.detection_service import DetectionService, get_detection_service
from app.core.schemas import DetectionResponse
from app.ml.registry import get_model_registry, ModelRegistry

logger = logging.getLogger(__name__)
router = APIRouter()

class DetectionRequest(BaseModel):
    session_id: str
    conditions: List[str] = Field(..., description="Health conditions to assess")
    include_explanations: bool = Field(default=True, description="Include SHAP explanations")
    confidence_threshold: float = Field(default=0.5, description="Minimum confidence threshold")
    
    class Config:
        schema_extra = {
            "example": {
                "session_id": "uuid-session-id",
                "conditions": ["diabetes", "heart_disease", "stroke"],
                "include_explanations": True,
                "confidence_threshold": 0.5
            }
        }

@router.post("/", response_model=DetectionResponse)
async def detect_risks(
    request: Request,
    detection_request: DetectionRequest,
    privacy_manager: PrivacyManager = Depends(get_privacy_manager),
    detection_service: DetectionService = Depends(get_detection_service),
    model_registry: ModelRegistry = Depends(get_model_registry)
):
    """
    Run ML ensemble models for health risk detection.
    Returns calibrated risk scores with confidence intervals and SHAP explanations.
    
    Args:
        detection_request: Request parameters for risk detection
        privacy_manager: Privacy management service
        detection_service: ML detection service
        model_registry: Model registry for loading trained models
        
    Returns:
        DetectionResponse with risk scores and explanations
    """
    request_id = getattr(request.state, 'request_id', 'unknown')
    
    try:
        logger.info(f"Processing risk detection - SessionID: {detection_request.session_id} - Conditions: {detection_request.conditions} - RequestID: {request_id}")
        
        # Validate session
        session_valid = await privacy_manager.validate_session(detection_request.session_id)
        if not session_valid:
            raise PrivacyException("Invalid or expired session")
        
        # Get session data
        session_data = await privacy_manager.get_session_data(detection_request.session_id)
        if not session_data:
            raise PrivacyException("Session data not found")
        
        # Validate that we have required data
        if 'patient_data' not in session_data:
            raise ValidationException("No patient data found in session. Please complete form ingestion first.")
        
        # Validate condition names
        available_conditions = model_registry.get_available_conditions()
        invalid_conditions = [c for c in detection_request.conditions if c not in available_conditions]
        if invalid_conditions:
            raise ValidationException(f"Invalid conditions: {invalid_conditions}. Available: {available_conditions}")
        
        # Prepare input data
        patient_data = session_data['patient_data']
        
        # Include extracted lab values if available
        lab_values = {}
        if 'extractions' in session_data:
            for file_id, extraction in session_data['extractions'].items():
                if 'extraction_result' in extraction:
                    file_lab_values = extraction['extraction_result'].get('lab_values', {})
                    lab_values.update(file_lab_values)
        
        # Combine patient data with lab values
        combined_data = {
            **patient_data,
            'lab_values': lab_values
        }
        
        # Run risk detection
        detection_results = await detection_service.detect_risks(
            patient_data=combined_data,
            conditions=detection_request.conditions,
            include_explanations=detection_request.include_explanations,
            confidence_threshold=detection_request.confidence_threshold
        )
        
        # Store results in session
        await privacy_manager.store_session_data(detection_request.session_id, {
            **session_data,
            'detection_results': detection_results,
            'detected_at': privacy_manager._get_current_timestamp(),
            'status': 'detection_completed'
        })
        
        logger.info(f"Risk detection completed - SessionID: {detection_request.session_id} - RequestID: {request_id}")
        
        return DetectionResponse(
            session_id=detection_request.session_id,
            status="success",
            message="Risk detection completed successfully",
            detection_results=detection_results,
            conditions_assessed=detection_request.conditions,
            overall_confidence=detection_results.get('overall_confidence', 0.0)
        )
        
    except (ValidationException, PrivacyException, ModelException):
        raise
    except Exception as e:
        logger.error(f"Error in risk detection - SessionID: {detection_request.session_id} - RequestID: {request_id} - {e}")
        raise HTTPException(status_code=500, detail="Failed to perform risk detection")

@router.get("/conditions")
async def list_available_conditions(
    request: Request,
    model_registry: ModelRegistry = Depends(get_model_registry)
):
    """
    List all available health conditions for risk assessment.
    
    Returns:
        List of available conditions with descriptions and model info
    """
    request_id = getattr(request.state, 'request_id', 'unknown')
    
    try:
        logger.info(f"Listing available conditions - RequestID: {request_id}")
        
        conditions = model_registry.get_available_conditions()
        condition_info = {}
        
        for condition in conditions:
            model_info = model_registry.get_condition_info(condition)
            condition_info[condition] = {
                "name": condition,
                "display_name": model_info.get('display_name', condition.replace('_', ' ').title()),
                "description": model_info.get('description', f"Risk assessment for {condition}"),
                "model_version": model_info.get('version', 'unknown'),
                "accuracy": model_info.get('accuracy', None),
                "last_trained": model_info.get('last_trained', None),
                "required_features": model_info.get('required_features', []),
                "optional_features": model_info.get('optional_features', [])
            }
        
        return {
            "available_conditions": list(conditions),
            "condition_details": condition_info,
            "total_conditions": len(conditions)
        }
        
    except Exception as e:
        logger.error(f"Error listing conditions - RequestID: {request_id} - {e}")
        raise HTTPException(status_code=500, detail="Failed to retrieve available conditions")

@router.get("/model-info/{condition}")
async def get_model_info(
    request: Request,
    condition: str,
    model_registry: ModelRegistry = Depends(get_model_registry)
):
    """
    Get detailed information about a specific condition's ML model.
    
    Args:
        condition: Health condition name
        
    Returns:
        Detailed model information and performance metrics
    """
    request_id = getattr(request.state, 'request_id', 'unknown')
    
    try:
        logger.info(f"Getting model info for condition: {condition} - RequestID: {request_id}")
        
        available_conditions = model_registry.get_available_conditions()
        if condition not in available_conditions:
            raise ValidationException(f"Invalid condition: {condition}. Available: {available_conditions}")
        
        model_info = model_registry.get_detailed_condition_info(condition)
        
        return {
            "condition": condition,
            "model_info": model_info,
            "status": "success"
        }
        
    except ValidationException:
        raise
    except Exception as e:
        logger.error(f"Error getting model info for {condition} - RequestID: {request_id} - {e}")
        raise HTTPException(status_code=500, detail="Failed to retrieve model information")

@router.post("/explain")
async def explain_predictions(
    request: Request,
    detection_request: DetectionRequest,
    privacy_manager: PrivacyManager = Depends(get_privacy_manager),
    detection_service: DetectionService = Depends(get_detection_service)
):
    """
    Generate detailed SHAP explanations for risk predictions.
    Provides feature importance and contribution analysis.
    
    Args:
        detection_request: Request parameters for explanation
        privacy_manager: Privacy management service
        detection_service: ML detection service
        
    Returns:
        Detailed SHAP explanations and feature importance
    """
    request_id = getattr(request.state, 'request_id', 'unknown')
    
    try:
        logger.info(f"Generating explanations - SessionID: {detection_request.session_id} - RequestID: {request_id}")
        
        # Validate session
        session_valid = await privacy_manager.validate_session(detection_request.session_id)
        if not session_valid:
            raise PrivacyException("Invalid or expired session")
        
        # Get session data
        session_data = await privacy_manager.get_session_data(detection_request.session_id)
        if not session_data:
            raise PrivacyException("Session data not found")
        
        # Check if we have previous detection results
        if 'detection_results' not in session_data:
            raise ValidationException("No previous detection results found. Please run detection first.")
        
        # Generate detailed explanations
        explanations = await detection_service.generate_explanations(
            session_data=session_data,
            conditions=detection_request.conditions
        )
        
        logger.info(f"Explanations generated - SessionID: {detection_request.session_id} - RequestID: {request_id}")
        
        return {
            "session_id": detection_request.session_id,
            "status": "success",
            "explanations": explanations,
            "conditions": detection_request.conditions
        }
        
    except (ValidationException, PrivacyException):
        raise
    except Exception as e:
        logger.error(f"Error generating explanations - SessionID: {detection_request.session_id} - RequestID: {request_id} - {e}")
        raise HTTPException(status_code=500, detail="Failed to generate explanations")
