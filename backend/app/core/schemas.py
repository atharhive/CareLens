"""
Pydantic schemas for request/response validation in the AI Health Risk Assessment Platform.
Medical-grade data validation with comprehensive field validation.
"""

from datetime import datetime, date
from typing import List, Optional, Dict, Any, Union
from enum import Enum

from pydantic import BaseModel, Field, validator, EmailStr

class ExtractionResponse(BaseModel):
    """Response model for document extraction."""
    file_id: str
    session_id: Optional[str] = None
    status: str
    message: str
    extraction_data: Dict[str, Any]
    confidence_score: float
    requires_review: bool

# Enums for standardized values
class GenderEnum(str, Enum):
    MALE = "male"
    FEMALE = "female"
    OTHER = "other"
    PREFER_NOT_TO_SAY = "prefer_not_to_say"

class EthnicityEnum(str, Enum):
    HISPANIC = "hispanic"
    NON_HISPANIC = "non_hispanic"
    PREFER_NOT_TO_SAY = "prefer_not_to_say"

class RaceEnum(str, Enum):
    WHITE = "white"
    BLACK = "black"
    ASIAN = "asian"
    NATIVE_AMERICAN = "native_american"
    PACIFIC_ISLANDER = "pacific_islander"
    MIXED = "mixed"
    OTHER = "other"
    PREFER_NOT_TO_SAY = "prefer_not_to_say"

class UrgencyLevelEnum(str, Enum):
    RED = "red"
    AMBER = "amber"
    GREEN = "green"

class ConditionEnum(str, Enum):
    DIABETES = "diabetes"
    HEART_DISEASE = "heart_disease"
    STROKE = "stroke"
    CKD = "ckd"
    LIVER_DISEASE = "liver_disease"
    ANEMIA = "anemia"
    THYROID = "thyroid"

# Base schemas
class TimestampedModel(BaseModel):
    """Base model with timestamp fields."""
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: Optional[datetime] = None

# Patient intake schemas
class VitalSigns(BaseModel):
    """Patient vital signs."""
    height_cm: Optional[float] = Field(None, ge=50, le=300, description="Height in centimeters")
    weight_kg: Optional[float] = Field(None, ge=1, le=1000, description="Weight in kilograms")
    blood_pressure_systolic: Optional[int] = Field(None, ge=60, le=300, description="Systolic BP in mmHg")
    blood_pressure_diastolic: Optional[int] = Field(None, ge=40, le=200, description="Diastolic BP in mmHg")
    heart_rate: Optional[int] = Field(None, ge=30, le=200, description="Heart rate in BPM")
    temperature_celsius: Optional[float] = Field(None, ge=30, le=45, description="Temperature in Celsius")
    
    @validator('blood_pressure_systolic', 'blood_pressure_diastolic')
    def validate_blood_pressure(cls, v, values):
        """Validate blood pressure values."""
        if 'blood_pressure_systolic' in values and values['blood_pressure_systolic'] is not None:
            if v is not None and v >= values['blood_pressure_systolic']:
                raise ValueError('Diastolic pressure must be less than systolic pressure')
        return v

class MedicalHistory(BaseModel):
    """Patient medical history."""
    conditions: List[str] = Field(default=[], description="List of existing medical conditions")
    medications: List[str] = Field(default=[], description="Current medications")
    allergies: List[str] = Field(default=[], description="Known allergies")
    surgeries: List[str] = Field(default=[], description="Previous surgeries")
    family_history: List[str] = Field(default=[], description="Family medical history")
    smoking_status: Optional[str] = Field(None, description="never/former/current")
    alcohol_consumption: Optional[str] = Field(None, description="none/light/moderate/heavy")

class LifestyleFactors(BaseModel):
    """Patient lifestyle information."""
    exercise_frequency: Optional[str] = Field(None, description="Exercise frequency per week")
    diet_type: Optional[str] = Field(None, description="Diet type (vegetarian, vegan, etc.)")
    stress_level: Optional[int] = Field(None, ge=1, le=10, description="Stress level 1-10")
    sleep_hours: Optional[float] = Field(None, ge=0, le=24, description="Average sleep hours per night")
    occupation: Optional[str] = Field(None, description="Patient occupation")

class Symptoms(BaseModel):
    """Current patient symptoms."""
    primary_complaint: Optional[str] = Field(None, description="Main reason for assessment")
    symptoms_list: List[str] = Field(default=[], description="List of current symptoms")
    symptom_duration: Optional[str] = Field(None, description="Duration of symptoms")
    pain_level: Optional[int] = Field(None, ge=0, le=10, description="Pain level 0-10")

class PatientIntakeSchema(BaseModel):
    """Complete patient intake form schema."""
    # Demographics
    age: int = Field(..., ge=0, le=150, description="Patient age in years")
    gender: GenderEnum = Field(..., description="Patient gender")
    ethnicity: Optional[EthnicityEnum] = Field(None, description="Patient ethnicity")
    race: Optional[RaceEnum] = Field(None, description="Patient race")
    
    # Contact information (optional for privacy)
    email: Optional[EmailStr] = Field(None, description="Patient email")
    phone: Optional[str] = Field(None, description="Patient phone number")
    
    # Medical information
    vital_signs: VitalSigns = Field(..., description="Patient vital signs")
    medical_history: MedicalHistory = Field(..., description="Patient medical history")
    lifestyle_factors: LifestyleFactors = Field(..., description="Patient lifestyle factors")
    symptoms: Symptoms = Field(..., description="Current symptoms")
    
    # Additional information
    insurance_type: Optional[str] = Field(None, description="Insurance type")
    preferred_language: Optional[str] = Field("english", description="Preferred language")
    emergency_contact: Optional[str] = Field(None, description="Emergency contact information")

class PatientIntakeResponse(TimestampedModel):
    """Response for patient intake."""
    session_id: str = Field(..., description="Unique session identifier")
    patient_id: str = Field(..., description="Anonymous patient identifier")
    bmi: Optional[float] = Field(None, description="Calculated BMI")
    risk_factors_identified: List[str] = Field(default=[], description="Identified risk factors")
    data_quality_score: float = Field(..., ge=0, le=1, description="Completeness score")

class SessionResponse(BaseModel):
    """Response for session creation."""
    session_id: str = Field(..., description="Unique session identifier")
    expires_at: datetime = Field(..., description="Session expiration time")
    status: str = Field("active", description="Session status")

# File upload schemas
class FileUploadResponse(TimestampedModel):
    """Response for file upload."""
    file_id: str = Field(..., description="Unique file identifier")
    session_id: str = Field(..., description="Associated session ID")
    filename: str = Field(..., description="Original filename")
    file_type: str = Field(..., description="File type")
    file_size: int = Field(..., description="File size in bytes")
    expires_at: datetime = Field(..., description="File expiration time")

# Document extraction schemas
class LabValue(BaseModel):
    """Individual lab test result."""
    test_name: str = Field(..., description="Name of the lab test")
    value: Union[float, str] = Field(..., description="Test result value")
    unit: str = Field(..., description="Unit of measurement")
    reference_range: Optional[str] = Field(None, description="Normal reference range")
    confidence_score: float = Field(..., ge=0, le=1, description="Extraction confidence")
    is_abnormal: Optional[bool] = Field(None, description="Whether value is outside normal range")

class ExtractionResult(TimestampedModel):
    """Document extraction results."""
    file_id: str = Field(..., description="File identifier")
    extraction_method: str = Field(..., description="Method used for extraction")
    lab_values: List[LabValue] = Field(default=[], description="Extracted lab values")
    text_confidence: float = Field(..., ge=0, le=1, description="Overall extraction confidence")
    requires_manual_review: bool = Field(..., description="Whether manual review is needed")
    extraction_errors: List[str] = Field(default=[], description="Extraction errors encountered")

# ML detection schemas
class DetectionRequest(BaseModel):
    """Request for ML risk detection."""
    session_id: str = Field(..., description="Session identifier")
    conditions: List[ConditionEnum] = Field(..., min_items=1, description="Conditions to assess")
    include_explanations: bool = Field(True, description="Whether to include SHAP explanations")

class RiskScore(BaseModel):
    """Individual condition risk score."""
    model_config = {"protected_namespaces": ()}
    
    condition: ConditionEnum = Field(..., description="Medical condition")
    risk_score: float = Field(..., ge=0, le=1, description="Calibrated risk probability")
    confidence_interval: Dict[str, float] = Field(..., description="95% confidence interval")
    risk_level: str = Field(..., description="Risk level (low/moderate/high)")
    model_version: str = Field(..., description="Model version used")

class FeatureImportance(BaseModel):
    """SHAP feature importance."""
    feature_name: str = Field(..., description="Feature name")
    importance_score: float = Field(..., description="SHAP importance value")
    feature_value: Union[float, str] = Field(..., description="Actual feature value")
    impact_direction: str = Field(..., description="positive/negative impact")

class ModelExplanation(BaseModel):
    """Model explanation with SHAP values."""
    model_config = {"protected_namespaces": ()}
    
    condition: ConditionEnum = Field(..., description="Medical condition")
    top_features: List[FeatureImportance] = Field(..., description="Top important features")
    explanation_text: str = Field(..., description="Human-readable explanation")
    model_card: Dict[str, Any] = Field(..., description="Model performance metrics")

class DetectionResponse(TimestampedModel):
    """Response for risk detection."""
    session_id: str = Field(..., description="Session identifier")
    risk_scores: List[RiskScore] = Field(..., description="Risk scores for each condition")
    explanations: List[ModelExplanation] = Field(default=[], description="Model explanations")
    overall_assessment: str = Field(..., description="Overall risk assessment summary")

# Triage schemas
class TriageRequest(BaseModel):
    """Request for risk triage."""
    session_id: str = Field(..., description="Session identifier")
    risk_scores: List[RiskScore] = Field(..., description="Risk scores from detection")
    symptoms: List[str] = Field(default=[], description="Current symptoms")
    vital_signs_abnormal: List[str] = Field(default=[], description="Abnormal vital signs")

class TriageRecommendation(BaseModel):
    """Triage recommendation."""
    urgency_level: UrgencyLevelEnum = Field(..., description="Urgency classification")
    recommended_action: str = Field(..., description="Recommended next steps")
    timeframe: str = Field(..., description="Recommended timeframe for action")
    specialist_type: Optional[str] = Field(None, description="Recommended specialist")
    warning_signs: List[str] = Field(default=[], description="Warning signs to watch for")
    safety_netting: str = Field(..., description="Safety netting advice")

class TriageResponse(TimestampedModel):
    """Response for triage assessment."""
    session_id: str = Field(..., description="Session identifier")
    triage_recommendation: TriageRecommendation = Field(..., description="Triage recommendation")
    priority_conditions: List[str] = Field(..., description="Conditions requiring priority attention")
    reasoning: str = Field(..., description="Reasoning for triage decision")

# Provider search schemas
class ProviderLocation(BaseModel):
    """Healthcare provider location information."""
    place_id: str = Field(..., description="Google Places ID")
    name: str = Field(..., description="Provider/facility name")
    address: str = Field(..., description="Full address")
    phone: Optional[str] = Field(None, description="Phone number")
    rating: Optional[float] = Field(None, ge=1, le=5, description="Google rating")
    distance_km: float = Field(..., description="Distance from search location")
    specialty: str = Field(..., description="Medical specialty")
    accepts_new_patients: Optional[bool] = Field(None, description="Whether accepting new patients")
    insurance_accepted: List[str] = Field(default=[], description="Accepted insurance types")

class ProviderSearchResponse(BaseModel):
    """Response for provider search."""
    providers: List[ProviderLocation] = Field(..., description="List of healthcare providers")
    search_location: Dict[str, float] = Field(..., description="Search coordinates")
    search_radius_km: int = Field(..., description="Search radius used")
    total_found: int = Field(..., description="Total providers found")

# Recommendations schemas
class RecommendationRequest(BaseModel):
    """Request for personalized recommendations."""
    session_id: str = Field(..., description="Session identifier")
    risk_scores: List[RiskScore] = Field(..., description="Risk scores")
    patient_preferences: Dict[str, Any] = Field(default={}, description="Patient preferences")
    cultural_considerations: Optional[str] = Field(None, description="Cultural considerations")

class LifestyleRecommendation(BaseModel):
    """Individual lifestyle recommendation."""
    category: str = Field(..., description="Recommendation category")
    recommendation: str = Field(..., description="Specific recommendation")
    priority: int = Field(..., ge=1, le=5, description="Priority level")
    evidence_level: str = Field(..., description="Evidence strength")
    personalization_factors: List[str] = Field(default=[], description="Personalization factors used")

class FollowUpRecommendation(BaseModel):
    """Follow-up care recommendation."""
    test_type: str = Field(..., description="Recommended test/assessment")
    timeframe: str = Field(..., description="Recommended timeframe")
    reason: str = Field(..., description="Reason for recommendation")
    priority: int = Field(..., ge=1, le=5, description="Priority level")

class RecommendationResponse(TimestampedModel):
    """Response for personalized recommendations."""
    session_id: str = Field(..., description="Session identifier")
    lifestyle_recommendations: List[LifestyleRecommendation] = Field(..., description="Lifestyle recommendations")
    follow_up_recommendations: List[FollowUpRecommendation] = Field(..., description="Follow-up recommendations")
    educational_resources: List[str] = Field(default=[], description="Educational resource links")
    personalization_summary: str = Field(..., description="Summary of personalization applied")

# Share schemas
class ShareRequest(BaseModel):
    """Request to create shareable link."""
    session_id: str = Field(..., description="Session identifier")
    include_personal_info: bool = Field(False, description="Whether to include personal information")
    expiry_days: int = Field(7, ge=1, le=30, description="Link expiry in days")
    password_protect: bool = Field(False, description="Whether to password protect")

class ShareResponse(TimestampedModel):
    """Response for share link creation."""
    share_id: str = Field(..., description="Unique share identifier")
    share_url: str = Field(..., description="Shareable URL")
    expires_at: datetime = Field(..., description="Link expiration time")
    password_required: bool = Field(..., description="Whether password is required")

# Error schemas
class ErrorDetail(BaseModel):
    """Detailed error information."""
    error_code: str = Field(..., description="Machine-readable error code")
    message: str = Field(..., description="Human-readable error message")
    field: Optional[str] = Field(None, description="Field causing the error")
    details: Optional[Dict[str, Any]] = Field(None, description="Additional error details")

class HealthCheckResponse(BaseModel):
    """Health check response schema."""
    status: str = Field(..., description="Overall service status")
    timestamp: datetime = Field(default_factory=datetime.utcnow, description="Check timestamp")
    services: Dict[str, Any] = Field(..., description="Status of individual services")
    version: str = Field(..., description="API version")

class ErrorResponse(BaseModel):
    """Standard error response."""
    error: str = Field(..., description="Error type")
    message: str = Field(..., description="Error message")
    request_id: str = Field(..., description="Request identifier for tracking")
    details: List[ErrorDetail] = Field(default=[], description="Detailed error information")
    timestamp: datetime = Field(default_factory=datetime.utcnow, description="Error timestamp")
