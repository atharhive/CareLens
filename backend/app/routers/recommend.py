"""
Personalized recommendation routes.
Rule-based system for generating lifestyle and healthcare recommendations.
"""
from fastapi import APIRouter, Depends, HTTPException, Request
from pydantic import BaseModel, Field
from typing import List, Dict, Any, Optional
import logging

from app.core.privacy import get_privacy_manager, PrivacyManager
from app.core.exceptions import ValidationException, PrivacyException
from app.services.recommendation_service import RecommendationService, get_recommendation_service
from app.core.schemas import RecommendationResponse

logger = logging.getLogger(__name__)
router = APIRouter()

class RecommendationRequest(BaseModel):
    session_id: str
    recommendation_types: List[str] = Field(
        default=["lifestyle", "dietary", "monitoring", "follow_up"],
        description="Types of recommendations to generate"
    )
    cultural_preferences: Optional[Dict[str, Any]] = Field(
        default=None,
        description="Cultural and dietary preferences for personalization"
    )
    lifestyle_goals: Optional[List[str]] = Field(
        default=None,
        description="Patient's lifestyle goals and preferences"
    )
    
    class Config:
        schema_extra = {
            "example": {
                "session_id": "uuid-session-id",
                "recommendation_types": ["lifestyle", "dietary", "monitoring"],
                "cultural_preferences": {
                    "diet_type": "mediterranean",
                    "exercise_preference": "low_impact",
                    "language": "english"
                },
                "lifestyle_goals": ["weight_loss", "stress_reduction", "better_sleep"]
            }
        }

@router.post("/", response_model=RecommendationResponse)
async def generate_recommendations(
    request: Request,
    recommendation_request: RecommendationRequest,
    privacy_manager: PrivacyManager = Depends(get_privacy_manager),
    recommendation_service: RecommendationService = Depends(get_recommendation_service)
):
    """
    Generate personalized healthcare recommendations based on risk profile.
    Includes lifestyle modifications, dietary suggestions, and monitoring plans.
    
    Args:
        recommendation_request: Request parameters for recommendations
        privacy_manager: Privacy management service
        recommendation_service: Recommendation generation service
        
    Returns:
        RecommendationResponse with personalized recommendations
    """
    request_id = getattr(request.state, 'request_id', 'unknown')
    
    try:
        logger.info(f"Generating recommendations - SessionID: {recommendation_request.session_id} - Types: {recommendation_request.recommendation_types} - RequestID: {request_id}")
        
        # Validate session
        session_valid = await privacy_manager.validate_session(recommendation_request.session_id)
        if not session_valid:
            raise PrivacyException("Invalid or expired session")
        
        # Get session data
        session_data = await privacy_manager.get_session_data(recommendation_request.session_id)
        if not session_data:
            raise PrivacyException("Session data not found")
        
        # Validate required data
        required_fields = ['patient_data']
        missing_fields = [field for field in required_fields if field not in session_data]
        if missing_fields:
            raise ValidationException(f"Missing required session data: {missing_fields}")
        
        # Generate recommendations
        recommendations = await recommendation_service.generate_recommendations(
            patient_data=session_data['patient_data'],
            detection_results=session_data.get('detection_results', {}),
            triage_results=session_data.get('triage_results', {}),
            recommendation_types=recommendation_request.recommendation_types,
            cultural_preferences=recommendation_request.cultural_preferences,
            lifestyle_goals=recommendation_request.lifestyle_goals
        )
        
        # Store recommendations in session
        await privacy_manager.store_session_data(recommendation_request.session_id, {
            **session_data,
            'recommendations': recommendations,
            'recommendation_request': recommendation_request.dict(),
            'recommended_at': privacy_manager._get_current_timestamp(),
            'status': 'recommendations_completed'
        })
        
        logger.info(f"Recommendations generated - SessionID: {recommendation_request.session_id} - RequestID: {request_id}")
        
        return RecommendationResponse(
            session_id=recommendation_request.session_id,
            status="success",
            message="Personalized recommendations generated successfully",
            recommendations=recommendations,
            recommendation_types=recommendation_request.recommendation_types,
            total_recommendations=sum(len(recs) for recs in recommendations.values())
        )
        
    except (ValidationException, PrivacyException):
        raise
    except Exception as e:
        logger.error(f"Error generating recommendations - SessionID: {recommendation_request.session_id} - RequestID: {request_id} - {e}")
        raise HTTPException(status_code=500, detail="Failed to generate recommendations")

@router.get("/types")
async def get_recommendation_types(request: Request):
    """
    Get available recommendation types and their descriptions.
    
    Returns:
        Available recommendation categories and descriptions
    """
    request_id = getattr(request.state, 'request_id', 'unknown')
    
    try:
        logger.info(f"Retrieving recommendation types - RequestID: {request_id}")
        
        recommendation_types = {
            "lifestyle": {
                "name": "Lifestyle Modifications",
                "description": "Exercise, activity, and general lifestyle recommendations",
                "examples": [
                    "Regular physical activity recommendations",
                    "Sleep hygiene improvements",
                    "Stress management techniques",
                    "Smoking cessation support"
                ]
            },
            "dietary": {
                "name": "Dietary Recommendations",
                "description": "Nutrition and dietary modification suggestions",
                "examples": [
                    "Heart-healthy diet plans",
                    "Diabetic-friendly meal suggestions",
                    "Weight management nutrition",
                    "Cultural dietary adaptations"
                ]
            },
            "monitoring": {
                "name": "Health Monitoring",
                "description": "Self-monitoring and tracking recommendations",
                "examples": [
                    "Blood pressure monitoring",
                    "Blood glucose tracking",
                    "Weight monitoring",
                    "Symptom journaling"
                ]
            },
            "follow_up": {
                "name": "Follow-up Care",
                "description": "Healthcare appointments and testing schedules",
                "examples": [
                    "Lab test scheduling",
                    "Specialist appointments",
                    "Screening reminders",
                    "Medication reviews"
                ]
            },
            "preventive": {
                "name": "Preventive Measures",
                "description": "Preventive care and screening recommendations",
                "examples": [
                    "Vaccination schedules",
                    "Cancer screenings",
                    "Preventive medications",
                    "Risk factor modifications"
                ]
            },
            "medication": {
                "name": "Medication Guidance",
                "description": "General medication management recommendations",
                "examples": [
                    "Medication adherence tips",
                    "Side effect monitoring",
                    "Drug interaction awareness",
                    "Generic alternatives discussion"
                ]
            }
        }
        
        return {
            "recommendation_types": recommendation_types,
            "total_types": len(recommendation_types)
        }
        
    except Exception as e:
        logger.error(f"Error retrieving recommendation types - RequestID: {request_id} - {e}")
        raise HTTPException(status_code=500, detail="Failed to retrieve recommendation types")

@router.get("/cultural-options")
async def get_cultural_options(request: Request):
    """
    Get available cultural and dietary preference options.
    
    Returns:
        Cultural customization options for recommendations
    """
    request_id = getattr(request.state, 'request_id', 'unknown')
    
    try:
        logger.info(f"Retrieving cultural options - RequestID: {request_id}")
        
        cultural_options = {
            "diet_types": [
                {"value": "mediterranean", "label": "Mediterranean Diet"},
                {"value": "dash", "label": "DASH Diet"},
                {"value": "low_sodium", "label": "Low Sodium"},
                {"value": "diabetic", "label": "Diabetic-Friendly"},
                {"value": "heart_healthy", "label": "Heart Healthy"},
                {"value": "vegetarian", "label": "Vegetarian"},
                {"value": "vegan", "label": "Vegan"},
                {"value": "halal", "label": "Halal"},
                {"value": "kosher", "label": "Kosher"},
                {"value": "gluten_free", "label": "Gluten-Free"}
            ],
            "exercise_preferences": [
                {"value": "low_impact", "label": "Low Impact Exercise"},
                {"value": "moderate", "label": "Moderate Intensity"},
                {"value": "high_intensity", "label": "High Intensity"},
                {"value": "water_based", "label": "Water-Based Activities"},
                {"value": "home_based", "label": "Home-Based Exercise"},
                {"value": "group_activities", "label": "Group Activities"},
                {"value": "outdoor", "label": "Outdoor Activities"}
            ],
            "lifestyle_goals": [
                {"value": "weight_loss", "label": "Weight Loss"},
                {"value": "weight_gain", "label": "Weight Gain"},
                {"value": "muscle_building", "label": "Muscle Building"},
                {"value": "stress_reduction", "label": "Stress Reduction"},
                {"value": "better_sleep", "label": "Better Sleep"},
                {"value": "increased_energy", "label": "Increased Energy"},
                {"value": "pain_management", "label": "Pain Management"},
                {"value": "mobility_improvement", "label": "Mobility Improvement"}
            ],
            "languages": [
                {"value": "english", "label": "English"},
                {"value": "spanish", "label": "Spanish"},
                {"value": "french", "label": "French"},
                {"value": "german", "label": "German"},
                {"value": "italian", "label": "Italian"},
                {"value": "portuguese", "label": "Portuguese"},
                {"value": "chinese", "label": "Chinese"},
                {"value": "japanese", "label": "Japanese"},
                {"value": "korean", "label": "Korean"},
                {"value": "arabic", "label": "Arabic"}
            ]
        }
        
        return {
            "cultural_options": cultural_options,
            "customization_note": "These options help personalize recommendations to fit your cultural background, dietary restrictions, and lifestyle preferences."
        }
        
    except Exception as e:
        logger.error(f"Error retrieving cultural options - RequestID: {request_id} - {e}")
        raise HTTPException(status_code=500, detail="Failed to retrieve cultural options")

@router.post("/personalize")
async def personalize_recommendations(
    request: Request,
    session_id: str,
    personalization_data: Dict[str, Any],
    privacy_manager: PrivacyManager = Depends(get_privacy_manager),
    recommendation_service: RecommendationService = Depends(get_recommendation_service)
):
    """
    Apply additional personalization to existing recommendations.
    
    Args:
        session_id: Session identifier
        personalization_data: Additional personalization parameters
        privacy_manager: Privacy management service
        recommendation_service: Recommendation service
        
    Returns:
        Updated personalized recommendations
    """
    request_id = getattr(request.state, 'request_id', 'unknown')
    
    try:
        logger.info(f"Personalizing recommendations - SessionID: {session_id} - RequestID: {request_id}")
        
        # Validate session
        session_valid = await privacy_manager.validate_session(session_id)
        if not session_valid:
            raise PrivacyException("Invalid or expired session")
        
        # Get session data
        session_data = await privacy_manager.get_session_data(session_id)
        if not session_data:
            raise PrivacyException("Session data not found")
        
        # Validate existing recommendations
        if 'recommendations' not in session_data:
            raise ValidationException("No existing recommendations found. Please generate recommendations first.")
        
        # Apply personalization
        personalized_recommendations = await recommendation_service.personalize_recommendations(
            existing_recommendations=session_data['recommendations'],
            patient_data=session_data['patient_data'],
            personalization_data=personalization_data
        )
        
        # Store updated recommendations
        await privacy_manager.store_session_data(session_id, {
            **session_data,
            'recommendations': personalized_recommendations,
            'personalization_data': personalization_data,
            'personalized_at': privacy_manager._get_current_timestamp()
        })
        
        logger.info(f"Recommendations personalized - SessionID: {session_id} - RequestID: {request_id}")
        
        return {
            "session_id": session_id,
            "status": "success",
            "message": "Recommendations personalized successfully",
            "recommendations": personalized_recommendations,
            "personalization_applied": personalization_data
        }
        
    except (ValidationException, PrivacyException):
        raise
    except Exception as e:
        logger.error(f"Error personalizing recommendations - SessionID: {session_id} - RequestID: {request_id} - {e}")
        raise HTTPException(status_code=500, detail="Failed to personalize recommendations")
