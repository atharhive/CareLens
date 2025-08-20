"""
Triage service for risk-based urgency classification and specialist recommendations.
Rule-based system with Red/Amber/Green classification and safety netting.
"""

import logging
from typing import Dict, List, Any, Optional
from datetime import datetime
import yaml
from pathlib import Path

from app.core.schemas import RiskScore, UrgencyLevelEnum, ConditionEnum
from app.core.config import settings

logger = logging.getLogger(__name__)

class TriageService:
    """
    Medical triage service for urgency classification and care coordination.
    
    Provides:
    - Rule-based urgency classification (Red/Amber/Green)
    - Specialist recommendations based on conditions
    - Safety netting and warning signs
    - Time-based action recommendations
    """
    
    def __init__(self):
        """Initialize triage service with rule configurations."""
        self.triage_rules = self._load_triage_rules()
        self.specialist_mappings = self._load_specialist_mappings()
        
    def _load_triage_rules(self) -> Dict[str, Any]:
        """Load triage rules from YAML configuration."""
        try:
            rules_path = Path("app/rules/triage_rules.yaml")
            if rules_path.exists():
                with open(rules_path, 'r') as file:
                    return yaml.safe_load(file)
            else:
                logger.warning("Triage rules file not found, using default rules")
                return self._get_default_triage_rules()
        except Exception as e:
            logger.error(f"Failed to load triage rules: {str(e)}")
            return self._get_default_triage_rules()
    
    def _load_specialist_mappings(self) -> Dict[str, Any]:
        """Load specialist mapping rules from YAML configuration."""
        try:
            mappings_path = Path("app/rules/specialist_mapping.yaml")
            if mappings_path.exists():
                with open(mappings_path, 'r') as file:
                    return yaml.safe_load(file)
            else:
                logger.warning("Specialist mappings file not found, using defaults")
                return self._get_default_specialist_mappings()
        except Exception as e:
            logger.error(f"Failed to load specialist mappings: {str(e)}")
            return self._get_default_specialist_mappings()
    
    async def assess_urgency(self, risk_scores: List[RiskScore], symptoms: List[str],
                           vital_signs_abnormal: List[str], 
                           patient_data: Dict[str, Any]) -> Dict[str, Any]:
        """
        Assess urgency level based on risk scores, symptoms, and patient data.
        
        Args:
            risk_scores: List of condition risk scores
            symptoms: Current patient symptoms
            vital_signs_abnormal: List of abnormal vital signs
            patient_data: Patient demographic and medical data
            
        Returns:
            Dictionary containing urgency level, recommendations, and reasoning
        """
        try:
            logger.info("Performing triage assessment")
            
            # Initialize assessment scores
            urgency_score = 0
            decision_factors = []
            
            # Analyze risk scores
            risk_analysis = self._analyze_risk_scores(risk_scores)
            urgency_score += risk_analysis["score"]
            decision_factors.extend(risk_analysis["factors"])
            
            # Analyze symptoms
            symptom_analysis = self._analyze_symptoms(symptoms)
            urgency_score += symptom_analysis["score"]
            decision_factors.extend(symptom_analysis["factors"])
            
            # Analyze vital signs
            vitals_analysis = self._analyze_vital_signs(vital_signs_abnormal)
            urgency_score += vitals_analysis["score"]
            decision_factors.extend(vitals_analysis["factors"])
            
            # Consider patient demographics
            demographics_analysis = self._analyze_demographics(patient_data)
            urgency_score += demographics_analysis["score"]
            decision_factors.extend(demographics_analysis["factors"])
            
            # Determine urgency level
            urgency_level = self._determine_urgency_level(urgency_score)
            
            # Get specialist recommendation
            specialist_recommendation = self._recommend_specialist(risk_scores, urgency_level)
            
            # Generate recommendations
            recommendations = self._generate_recommendations(
                urgency_level, risk_scores, symptoms, vital_signs_abnormal
            )
            
            # Get warning signs and safety netting
            warning_signs = self._get_warning_signs(risk_scores)
            safety_netting = self._get_safety_netting(urgency_level)
            
            result = {
                "urgency_level": urgency_level,
                "urgency_score": urgency_score,
                "recommended_action": recommendations["action"],
                "timeframe": recommendations["timeframe"],
                "specialist_type": specialist_recommendation,
                "warning_signs": warning_signs,
                "safety_netting": safety_netting,
                "decision_factors": decision_factors,
                "timestamp": datetime.utcnow().isoformat()
            }
            
            logger.info(f"Triage assessment completed: {urgency_level} level")
            return result
            
        except Exception as e:
            logger.error(f"Triage assessment failed: {str(e)}", exc_info=True)
            # Return safe default (high urgency)
            return {
                "urgency_level": "red",
                "recommended_action": "Seek immediate medical attention",
                "timeframe": "Immediately",
                "specialist_type": "emergency_medicine",
                "warning_signs": ["Any worsening of symptoms"],
                "safety_netting": "Contact emergency services if symptoms worsen",
                "error": str(e),
                "timestamp": datetime.utcnow().isoformat()
            }
    
    def _analyze_risk_scores(self, risk_scores: List[RiskScore]) -> Dict[str, Any]:
        """Analyze risk scores and assign urgency points."""
        score = 0
        factors = []
        
        for risk_score in risk_scores:
            risk_value = risk_score.risk_score
            condition = risk_score.condition.value
            
            # High risk conditions
            if risk_value >= 0.8:
                score += 3
                factors.append(f"Very high risk for {condition} ({risk_value:.1%})")
            elif risk_value >= 0.6:
                score += 2
                factors.append(f"High risk for {condition} ({risk_value:.1%})")
            elif risk_value >= 0.4:
                score += 1
                factors.append(f"Moderate risk for {condition} ({risk_value:.1%})")
            
            # Specific condition urgency modifiers
            if condition in ["heart_disease", "stroke"] and risk_value >= 0.7:
                score += 1  # Extra urgency for cardiovascular conditions
                factors.append(f"Cardiovascular condition requires urgent attention")
        
        return {"score": score, "factors": factors}
    
    def _analyze_symptoms(self, symptoms: List[str]) -> Dict[str, Any]:
        """Analyze symptoms for urgency indicators."""
        score = 0
        factors = []
        
        # Red flag symptoms
        red_flag_symptoms = [
            "chest pain", "severe pain", "difficulty breathing", "shortness of breath",
            "unconscious", "seizure", "severe headache", "sudden weakness",
            "confusion", "severe bleeding", "severe nausea", "severe vomiting"
        ]
        
        # Amber symptoms
        amber_symptoms = [
            "pain", "headache", "nausea", "dizziness", "fatigue", "weakness",
            "numbness", "tingling", "blurred vision", "frequent urination"
        ]
        
        for symptom in symptoms:
            symptom_lower = symptom.lower()
            
            # Check for red flag symptoms
            if any(red_flag in symptom_lower for red_flag in red_flag_symptoms):
                score += 3
                factors.append(f"Critical symptom: {symptom}")
            
            # Check for amber symptoms
            elif any(amber_symptom in symptom_lower for amber_symptom in amber_symptoms):
                score += 1
                factors.append(f"Concerning symptom: {symptom}")
        
        return {"score": score, "factors": factors}
    
    def _analyze_vital_signs(self, vital_signs_abnormal: List[str]) -> Dict[str, Any]:
        """Analyze abnormal vital signs for urgency."""
        score = 0
        factors = []
        
        # Critical vital sign abnormalities
        critical_vitals = [
            "severe hypertension", "severe hypotension", "tachycardia",
            "bradycardia", "fever", "hypothermia", "severe pain"
        ]
        
        for vital_sign in vital_signs_abnormal:
            vital_lower = vital_sign.lower()
            
            if any(critical in vital_lower for critical in critical_vitals):
                score += 2
                factors.append(f"Critical vital sign: {vital_sign}")
            else:
                score += 1
                factors.append(f"Abnormal vital sign: {vital_sign}")
        
        return {"score": score, "factors": factors}
    
    def _analyze_demographics(self, patient_data: Dict[str, Any]) -> Dict[str, Any]:
        """Analyze patient demographics for risk modifiers."""
        score = 0
        factors = []
        
        age = patient_data.get("age", 0)
        
        # Age-based risk modifiers
        if age >= 75:
            score += 2
            factors.append("Advanced age increases urgency")
        elif age >= 65:
            score += 1
            factors.append("Senior age requires closer monitoring")
        elif age < 18:
            score += 1
            factors.append("Pediatric patient requires specialized care")
        
        # High-risk medical history
        medical_history = patient_data.get("medical_history", {})
        conditions = medical_history.get("conditions", [])
        
        high_risk_conditions = [
            "diabetes", "heart disease", "stroke", "kidney disease",
            "liver disease", "cancer", "copd", "immunocompromised"
        ]
        
        for condition in conditions:
            if any(risk_condition in condition.lower() for risk_condition in high_risk_conditions):
                score += 1
                factors.append(f"High-risk medical history: {condition}")
        
        return {"score": score, "factors": factors}
    
    def _determine_urgency_level(self, urgency_score: int) -> str:
        """Determine urgency level based on total score."""
        if urgency_score >= 6:
            return "red"
        elif urgency_score >= 3:
            return "amber"
        else:
            return "green"
    
    def _recommend_specialist(self, risk_scores: List[RiskScore], 
                            urgency_level: str) -> Optional[str]:
        """Recommend appropriate specialist based on risk profile."""
        # Get highest risk condition
        if not risk_scores:
            return None
        
        highest_risk = max(risk_scores, key=lambda x: x.risk_score)
        
        # Only recommend specialist for moderate+ urgency
        if urgency_level == "green" and highest_risk.risk_score < 0.6:
            return None
        
        # Map conditions to specialists
        specialist_mapping = {
            ConditionEnum.DIABETES: "endocrinology",
            ConditionEnum.HEART_DISEASE: "cardiology",
            ConditionEnum.STROKE: "neurology",
            ConditionEnum.CKD: "nephrology",
            ConditionEnum.LIVER_DISEASE: "gastroenterology",
            ConditionEnum.ANEMIA: "hematology",
            ConditionEnum.THYROID: "endocrinology"
        }
        
        return specialist_mapping.get(highest_risk.condition, "internal_medicine")
    
    def _generate_recommendations(self, urgency_level: str, risk_scores: List[RiskScore],
                                symptoms: List[str], vital_signs_abnormal: List[str]) -> Dict[str, str]:
        """Generate action recommendations and timeframes."""
        if urgency_level == "red":
            return {
                "action": "Seek immediate medical attention at emergency department",
                "timeframe": "Immediately - within 1-2 hours"
            }
        elif urgency_level == "amber":
            return {
                "action": "Schedule urgent medical appointment or visit urgent care",
                "timeframe": "Within 24 hours"
            }
        else:  # green
            return {
                "action": "Schedule routine medical appointment for evaluation",
                "timeframe": "Within 1-2 weeks"
            }
    
    def _get_warning_signs(self, risk_scores: List[RiskScore]) -> List[str]:
        """Get condition-specific warning signs to watch for."""
        warning_signs = [
            "Any sudden worsening of symptoms",
            "New or severe chest pain",
            "Difficulty breathing or shortness of breath",
            "Severe headache or confusion",
            "Loss of consciousness or fainting",
            "Severe bleeding or injury"
        ]
        
        # Add condition-specific warning signs
        condition_warnings = {
            ConditionEnum.DIABETES: [
                "Extreme thirst or frequent urination",
                "Severe fatigue or weakness",
                "Blurred vision or changes in vision"
            ],
            ConditionEnum.HEART_DISEASE: [
                "Chest pain or pressure",
                "Pain radiating to arm, jaw, or back",
                "Irregular heartbeat or palpitations"
            ],
            ConditionEnum.STROKE: [
                "Sudden weakness or numbness",
                "Sudden speech problems",
                "Sudden severe headache"
            ]
        }
        
        for risk_score in risk_scores:
            if risk_score.risk_score >= 0.5:  # Only for moderate+ risk
                condition_specific = condition_warnings.get(risk_score.condition, [])
                warning_signs.extend(condition_specific)
        
        return list(set(warning_signs))  # Remove duplicates
    
    def _get_safety_netting(self, urgency_level: str) -> str:
        """Get safety netting advice based on urgency level."""
        safety_messages = {
            "red": "If symptoms worsen or you feel unwell, call emergency services (911) immediately. Do not delay seeking emergency care.",
            "amber": "If symptoms worsen significantly or new concerning symptoms develop, seek immediate medical attention. Return if not improving within 24-48 hours.",
            "green": "Monitor symptoms and follow up as planned. Seek medical attention if symptoms worsen or new concerning symptoms develop."
        }
        
        return safety_messages.get(urgency_level, safety_messages["amber"])
    
    def get_triage_rules_info(self) -> Dict[str, Any]:
        """Get information about triage rules and criteria."""
        return {
            "urgency_levels": {
                "red": {
                    "description": "Immediate attention required",
                    "score_threshold": 6,
                    "timeframe": "1-2 hours"
                },
                "amber": {
                    "description": "Urgent attention recommended",
                    "score_threshold": 3,
                    "timeframe": "24 hours"
                },
                "green": {
                    "description": "Routine follow-up",
                    "score_threshold": 0,
                    "timeframe": "1-2 weeks"
                }
            },
            "scoring_factors": {
                "risk_scores": "0-3 points based on risk level",
                "symptoms": "1-3 points based on severity",
                "vital_signs": "1-2 points for abnormalities",
                "demographics": "0-2 points for risk factors"
            }
        }
    
    def get_specialist_mappings(self) -> Dict[str, str]:
        """Get specialist mapping information."""
        return {
            "diabetes": "Endocrinology",
            "heart_disease": "Cardiology",
            "stroke": "Neurology",
            "ckd": "Nephrology",
            "liver_disease": "Gastroenterology",
            "anemia": "Hematology",
            "thyroid": "Endocrinology",
            "default": "Internal Medicine"
        }
    
    def _get_default_triage_rules(self) -> Dict[str, Any]:
        """Get default triage rules if configuration file is not available."""
        return {
            "urgency_thresholds": {
                "red": 6,
                "amber": 3,
                "green": 0
            },
            "risk_score_weights": {
                "very_high": 3,
                "high": 2,
                "moderate": 1,
                "low": 0
            },
            "symptom_weights": {
                "critical": 3,
                "concerning": 1,
                "mild": 0
            }
        }
    
    def _get_default_specialist_mappings(self) -> Dict[str, Any]:
        """Get default specialist mappings if configuration file is not available."""
        return {
            "condition_mappings": {
                "diabetes": "endocrinology",
                "heart_disease": "cardiology",
                "stroke": "neurology",
                "ckd": "nephrology",
                "liver_disease": "gastroenterology",
                "anemia": "hematology",
                "thyroid": "endocrinology"
            },
            "default_specialist": "internal_medicine"
        }

async def get_triage_service() -> TriageService:
    """Get the triage service instance."""
    return TriageService()
