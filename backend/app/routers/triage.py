"""
Triage and urgency classification routes.
Rule-based system for determining medical urgency and specialist recommendations.
"""
from fastapi import APIRouter, Depends, HTTPException, Request
from pydantic import BaseModel, Field
from typing import List, Dict, Any, Optional
import logging

from app.core.privacy import get_privacy_manager, PrivacyManager
from app.core.exceptions import ValidationException, PrivacyException
from app.services.triage_service import TriageService, get_triage_service
from app.core.schemas import TriageResponse

logger = logging.getLogger(__name__)
router = APIRouter()

class TriageRequest(BaseModel):
    session_id: str
    risk_thresholds: Optional[Dict[str, float]] = Field(
        default=None,
        description="Custom risk thresholds for triage classification"
    )
    include_safety_netting: bool = Field(
        default=True,
        description="Include safety netting and warning signs"
    )
    
    class Config:
        schema_extra = {
            "example": {
                "session_id": "uuid-session-id",
                "risk_thresholds": {
                    "red": 0.8,
                    "amber": 0.5,
                    "green": 0.2
                },
                "include_safety_netting": True
            }
        }

@router.post("/", response_model=TriageResponse)
async def triage_assessment(
    request: Request,
    triage_request: TriageRequest,
    privacy_manager: PrivacyManager = Depends(get_privacy_manager),
    triage_service: TriageService = Depends(get_triage_service)
):
    """
    Perform rule-based urgency classification and generate specialist recommendations.
    
    Classifications:
    - Red: Urgent medical attention required (within 24 hours)
    - Amber: Semi-urgent attention needed (within 1-2 weeks)
    - Green: Routine care or monitoring (within 1-3 months)
    
    Args:
        triage_request: Triage parameters and session ID
        privacy_manager: Privacy management service
        triage_service: Triage classification service
        
    Returns:
        TriageResponse with urgency classification and recommendations
    """
    request_id = getattr(request.state, 'request_id', 'unknown')
    
    try:
        logger.info(f"Processing triage assessment - SessionID: {triage_request.session_id} - RequestID: {request_id}")
        
        # Validate session
        session_valid = await privacy_manager.validate_session(triage_request.session_id)
        if not session_valid:
            raise PrivacyException("Invalid or expired session")
        
        # Get session data
        session_data = await privacy_manager.get_session_data(triage_request.session_id)
        if not session_data:
            raise PrivacyException("Session data not found")
        
        # Validate required data
        if 'patient_data' not in session_data:
            raise ValidationException("No patient data found in session")
        
        if 'detection_results' not in session_data:
            raise ValidationException("No risk detection results found. Please run detection first.")
        
        # Perform triage assessment
        triage_result = await triage_service.assess_urgency(
            patient_data=session_data['patient_data'],
            detection_results=session_data['detection_results'],
            risk_thresholds=triage_request.risk_thresholds,
            include_safety_netting=triage_request.include_safety_netting
        )
        
        # Store triage results in session
        await privacy_manager.store_session_data(triage_request.session_id, {
            **session_data,
            'triage_results': triage_result,
            'triaged_at': privacy_manager._get_current_timestamp(),
            'status': 'triage_completed'
        })
        
        logger.info(f"Triage assessment completed - SessionID: {triage_request.session_id} - Classification: {triage_result.get('overall_classification')} - RequestID: {request_id}")
        
        return TriageResponse(
            session_id=triage_request.session_id,
            status="success",
            message="Triage assessment completed successfully",
            triage_results=triage_result,
            overall_classification=triage_result.get('overall_classification', 'unknown'),
            urgency_level=triage_result.get('urgency_level', 0)
        )
        
    except (ValidationException, PrivacyException):
        raise
    except Exception as e:
        logger.error(f"Error in triage assessment - SessionID: {triage_request.session_id} - RequestID: {request_id} - {e}")
        raise HTTPException(status_code=500, detail="Failed to perform triage assessment")

@router.get("/classification-guide")
async def get_classification_guide(request: Request):
    """
    Get the triage classification guide with criteria and thresholds.
    
    Returns:
        Detailed triage classification criteria and guidelines
    """
    request_id = getattr(request.state, 'request_id', 'unknown')
    
    try:
        logger.info(f"Retrieving classification guide - RequestID: {request_id}")
        
        classification_guide = {
            "red": {
                "name": "Urgent",
                "timeline": "Within 24 hours",
                "description": "Immediate medical attention required",
                "criteria": [
                    "High risk scores (>0.8) for multiple conditions",
                    "Critical lab values outside normal ranges",
                    "Severe symptoms reported",
                    "Multiple high-risk factors present",
                    "Age >75 with concerning findings"
                ],
                "actions": [
                    "Contact healthcare provider immediately",
                    "Consider emergency department visit",
                    "Arrange urgent specialist referral",
                    "Monitor symptoms closely"
                ]
            },
            "amber": {
                "name": "Semi-urgent",
                "timeline": "Within 1-2 weeks",
                "description": "Medical evaluation needed soon",
                "criteria": [
                    "Moderate risk scores (0.5-0.8) for one or more conditions",
                    "Some concerning lab values",
                    "Notable symptoms that require attention",
                    "Family history of relevant conditions",
                    "Age >65 with risk factors"
                ],
                "actions": [
                    "Schedule appointment with primary care provider",
                    "Consider specialist consultation",
                    "Follow up on symptoms",
                    "Lifestyle modifications recommended"
                ]
            },
            "green": {
                "name": "Routine",
                "timeline": "Within 1-3 months",
                "description": "Routine monitoring or preventive care",
                "criteria": [
                    "Low to moderate risk scores (<0.5)",
                    "Normal or slightly abnormal lab values",
                    "Minimal concerning symptoms",
                    "Good overall health profile",
                    "Young age with few risk factors"
                ],
                "actions": [
                    "Routine follow-up with primary care",
                    "Annual health screening",
                    "Lifestyle counseling",
                    "Preventive measures implementation"
                ]
            }
        }
        
        return {
            "classification_guide": classification_guide,
            "default_thresholds": {
                "red": 0.8,
                "amber": 0.5,
                "green": 0.2
            },
            "safety_netting": {
                "description": "Additional warning signs that warrant immediate attention",
                "warning_signs": [
                    "Chest pain or pressure",
                    "Severe shortness of breath",
                    "Sudden severe headache",
                    "Loss of consciousness",
                    "Severe abdominal pain",
                    "Signs of stroke (FAST symptoms)",
                    "Severe allergic reactions"
                ]
            }
        }
        
    except Exception as e:
        logger.error(f"Error retrieving classification guide - RequestID: {request_id} - {e}")
        raise HTTPException(status_code=500, detail="Failed to retrieve classification guide")

@router.get("/specialists")
async def get_specialist_mapping(
    request: Request,
    triage_service: TriageService = Depends(get_triage_service)
):
    """
    Get the specialist mapping for different health conditions.
    
    Returns:
        Mapping of health conditions to appropriate medical specialists
    """
    request_id = getattr(request.state, 'request_id', 'unknown')
    
    try:
        logger.info(f"Retrieving specialist mapping - RequestID: {request_id}")
        
        specialist_mapping = triage_service.get_specialist_mapping()
        
        return {
            "specialist_mapping": specialist_mapping,
            "status": "success"
        }
        
    except Exception as e:
        logger.error(f"Error retrieving specialist mapping - RequestID: {request_id} - {e}")
        raise HTTPException(status_code=500, detail="Failed to retrieve specialist mapping")

@router.post("/custom-rules")
async def apply_custom_triage_rules(
    request: Request,
    session_id: str,
    custom_rules: Dict[str, Any],
    privacy_manager: PrivacyManager = Depends(get_privacy_manager),
    triage_service: TriageService = Depends(get_triage_service)
):
    """
    Apply custom triage rules for specialized healthcare scenarios.
    Allows healthcare providers to customize triage logic.
    
    Args:
        session_id: Patient session identifier
        custom_rules: Custom triage rules and thresholds
        privacy_manager: Privacy management service
        triage_service: Triage classification service
        
    Returns:
        Updated triage assessment with custom rules applied
    """
    request_id = getattr(request.state, 'request_id', 'unknown')
    
    try:
        logger.info(f"Applying custom triage rules - SessionID: {session_id} - RequestID: {request_id}")
        
        # Validate session
        session_valid = await privacy_manager.validate_session(session_id)
        if not session_valid:
            raise PrivacyException("Invalid or expired session")
        
        # Get session data
        session_data = await privacy_manager.get_session_data(session_id)
        if not session_data:
            raise PrivacyException("Session data not found")
        
        # Validate required data
        if 'triage_results' not in session_data:
            raise ValidationException("No existing triage results found. Please run triage assessment first.")
        
        # Apply custom rules
        updated_triage = await triage_service.apply_custom_rules(
            existing_triage=session_data['triage_results'],
            patient_data=session_data['patient_data'],
            custom_rules=custom_rules
        )
        
        # Store updated results
        await privacy_manager.store_session_data(session_id, {
            **session_data,
            'triage_results': updated_triage,
            'custom_rules_applied': custom_rules,
            'updated_at': privacy_manager._get_current_timestamp()
        })
        
        logger.info(f"Custom triage rules applied - SessionID: {session_id} - RequestID: {request_id}")
        
        return {
            "session_id": session_id,
            "status": "success",
            "message": "Custom triage rules applied successfully",
            "updated_triage": updated_triage,
            "rules_applied": custom_rules
        }
        
    except (ValidationException, PrivacyException):
        raise
    except Exception as e:
        logger.error(f"Error applying custom triage rules - SessionID: {session_id} - RequestID: {request_id} - {e}")
        raise HTTPException(status_code=500, detail="Failed to apply custom triage rules")
