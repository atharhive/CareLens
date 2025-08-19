"""
Recommendation service for personalized health guidance and follow-up care.
Rule-based system with cultural adaptations and evidence-based recommendations.
"""

import logging
from typing import Dict, List, Any, Optional
from datetime import datetime
import yaml
from pathlib import Path

from app.core.schemas import RiskScore, ConditionEnum
from app.core.config import settings

logger = logging.getLogger(__name__)

class RecommendationService:
    """
    Personalized health recommendation service.
    
    Provides:
    - Lifestyle modification recommendations
    - Follow-up care scheduling
    - Cultural and dietary adaptations
    - Evidence-based guidance with priority scoring
    """
    
    def __init__(self):
        """Initialize recommendation service with rule configurations."""
        self.recommendation_rules = self._load_recommendation_rules()
        
    def _load_recommendation_rules(self) -> Dict[str, Any]:
        """Load recommendation rules from YAML configuration."""
        try:
            rules_path = Path("app/rules/recommendations.yaml")
            if rules_path.exists():
                with open(rules_path, 'r') as file:
                    return yaml.safe_load(file)
            else:
                logger.warning("Recommendation rules file not found, using defaults")
                return self._get_default_recommendation_rules()
        except Exception as e:
            logger.error(f"Failed to load recommendation rules: {str(e)}")
            return self._get_default_recommendation_rules()
    
    async def generate_recommendations(self, risk_scores: List[RiskScore],
                                     patient_data: Dict[str, Any],
                                     preferences: Dict[str, Any] = None,
                                     cultural_considerations: str = None,
                                     preview_mode: bool = False) -> Dict[str, Any]:
        """
        Generate personalized recommendations based on risk profile and preferences.
        
        Args:
            risk_scores: List of condition risk scores
            patient_data: Patient demographic and medical data
            preferences: Patient preferences for recommendations
            cultural_considerations: Cultural background considerations
            preview_mode: Whether this is a preview (don't store results)
            
        Returns:
            Dictionary containing lifestyle and follow-up recommendations
        """
        try:
            logger.info("Generating personalized recommendations")
            
            if preferences is None:
                preferences = {}
            
            # Generate lifestyle recommendations
            lifestyle_recommendations = self._generate_lifestyle_recommendations(
                risk_scores, patient_data, preferences, cultural_considerations
            )
            
            # Generate follow-up recommendations
            follow_up_recommendations = self._generate_follow_up_recommendations(
                risk_scores, patient_data
            )
            
            # Get educational resources
            educational_resources = self._get_educational_resources(
                risk_scores, patient_data.get("preferred_language", "english")
            )
            
            # Generate personalization summary
            personalization_summary = self._generate_personalization_summary(
                patient_data, preferences, cultural_considerations
            )
            
            result = {
                "lifestyle_recommendations": lifestyle_recommendations,
                "follow_up_recommendations": follow_up_recommendations,
                "educational_resources": educational_resources,
                "personalization_summary": personalization_summary,
                "timestamp": datetime.utcnow().isoformat(),
                "preview_mode": preview_mode
            }
            
            logger.info(f"Generated {len(lifestyle_recommendations)} lifestyle and {len(follow_up_recommendations)} follow-up recommendations")
            return result
            
        except Exception as e:
            logger.error(f"Recommendation generation failed: {str(e)}", exc_info=True)
            # Return minimal safe recommendations
            return {
                "lifestyle_recommendations": [
                    {
                        "category": "general",
                        "recommendation": "Maintain a healthy lifestyle with regular exercise and balanced diet",
                        "priority": 3,
                        "evidence_level": "high",
                        "personalization_factors": []
                    }
                ],
                "follow_up_recommendations": [
                    {
                        "test_type": "general_checkup",
                        "timeframe": "Annual",
                        "reason": "Regular health monitoring",
                        "priority": 3
                    }
                ],
                "educational_resources": [],
                "personalization_summary": "Basic recommendations provided due to processing error",
                "error": str(e),
                "timestamp": datetime.utcnow().isoformat()
            }
    
    def _generate_lifestyle_recommendations(self, risk_scores: List[RiskScore],
                                          patient_data: Dict[str, Any],
                                          preferences: Dict[str, Any],
                                          cultural_considerations: str) -> List[Dict[str, Any]]:
        """Generate lifestyle modification recommendations."""
        recommendations = []
        
        # Get patient characteristics
        age = patient_data.get("age", 45)
        bmi = self._calculate_bmi(patient_data)
        lifestyle_factors = patient_data.get("lifestyle_factors", {})
        medical_history = patient_data.get("medical_history", {})
        
        # Diet recommendations
        diet_recs = self._get_diet_recommendations(
            risk_scores, bmi, cultural_considerations, preferences
        )
        recommendations.extend(diet_recs)
        
        # Exercise recommendations
        exercise_recs = self._get_exercise_recommendations(
            risk_scores, age, lifestyle_factors, preferences
        )
        recommendations.extend(exercise_recs)
        
        # Weight management recommendations
        if bmi:
            weight_recs = self._get_weight_management_recommendations(bmi, risk_scores)
            recommendations.extend(weight_recs)
        
        # Smoking cessation recommendations
        if medical_history.get("smoking_status") == "current":
            smoking_recs = self._get_smoking_cessation_recommendations(risk_scores)
            recommendations.extend(smoking_recs)
        
        # Stress management recommendations
        stress_recs = self._get_stress_management_recommendations(
            lifestyle_factors, risk_scores
        )
        recommendations.extend(stress_recs)
        
        # Sleep recommendations
        sleep_recs = self._get_sleep_recommendations(lifestyle_factors, age)
        recommendations.extend(sleep_recs)
        
        # Sort by priority and return top recommendations
        recommendations.sort(key=lambda x: x["priority"], reverse=True)
        return recommendations[:8]  # Limit to top 8 recommendations
    
    def _generate_follow_up_recommendations(self, risk_scores: List[RiskScore],
                                          patient_data: Dict[str, Any]) -> List[Dict[str, Any]]:
        """Generate follow-up care and testing recommendations."""
        recommendations = []
        
        age = patient_data.get("age", 45)
        gender = patient_data.get("gender", "unknown")
        medical_history = patient_data.get("medical_history", {})
        
        # Condition-specific follow-ups
        for risk_score in risk_scores:
            if risk_score.risk_score >= 0.4:  # Moderate+ risk
                condition_followups = self._get_condition_followups(
                    risk_score.condition, risk_score.risk_score, age
                )
                recommendations.extend(condition_followups)
        
        # Age-based screening recommendations
        screening_recs = self._get_age_based_screening(age, gender)
        recommendations.extend(screening_recs)
        
        # Preventive care recommendations
        preventive_recs = self._get_preventive_care_recommendations(
            age, medical_history, risk_scores
        )
        recommendations.extend(preventive_recs)
        
        # Remove duplicates and sort by priority
        unique_recommendations = []
        seen_tests = set()
        for rec in recommendations:
            if rec["test_type"] not in seen_tests:
                unique_recommendations.append(rec)
                seen_tests.add(rec["test_type"])
        
        unique_recommendations.sort(key=lambda x: x["priority"], reverse=True)
        return unique_recommendations
    
    def _get_diet_recommendations(self, risk_scores: List[RiskScore], bmi: Optional[float],
                                cultural_considerations: str, preferences: Dict[str, Any]) -> List[Dict[str, Any]]:
        """Generate diet and nutrition recommendations."""
        recommendations = []
        
        # Base diet recommendations
        high_risk_conditions = [score for score in risk_scores if score.risk_score >= 0.6]
        
        for risk_score in high_risk_conditions:
            condition = risk_score.condition
            
            if condition == ConditionEnum.DIABETES:
                recommendations.append({
                    "category": "diet",
                    "recommendation": "Follow a low-carbohydrate diet with emphasis on complex carbohydrates, fiber-rich foods, and portion control",
                    "priority": 5,
                    "evidence_level": "high",
                    "personalization_factors": ["diabetes_risk", "blood_sugar_control"]
                })
            
            elif condition == ConditionEnum.HEART_DISEASE:
                recommendations.append({
                    "category": "diet",
                    "recommendation": "Adopt a Mediterranean-style diet rich in fruits, vegetables, whole grains, lean proteins, and healthy fats",
                    "priority": 5,
                    "evidence_level": "high",
                    "personalization_factors": ["cardiovascular_risk", "cholesterol_management"]
                })
            
            elif condition == ConditionEnum.CKD:
                recommendations.append({
                    "category": "diet",
                    "recommendation": "Limit sodium, phosphorus, and protein intake as appropriate; focus on kidney-friendly foods",
                    "priority": 4,
                    "evidence_level": "high",
                    "personalization_factors": ["kidney_function", "mineral_balance"]
                })
        
        # Weight-based diet recommendations
        if bmi and bmi >= 25:
            recommendations.append({
                "category": "diet",
                "recommendation": "Create a moderate caloric deficit through portion control and nutrient-dense food choices",
                "priority": 4,
                "evidence_level": "high",
                "personalization_factors": ["weight_management", "bmi_reduction"]
            })
        
        # Cultural adaptations
        if cultural_considerations:
            cultural_factor = cultural_considerations.lower()
            if "mediterranean" in cultural_factor:
                recommendations.append({
                    "category": "diet",
                    "recommendation": "Continue traditional Mediterranean dietary patterns with emphasis on olive oil, fish, and fresh vegetables",
                    "priority": 3,
                    "evidence_level": "high",
                    "personalization_factors": ["cultural_preference", "traditional_diet"]
                })
            elif "asian" in cultural_factor:
                recommendations.append({
                    "category": "diet",
                    "recommendation": "Incorporate traditional Asian dietary principles with reduced sodium and increased vegetable content",
                    "priority": 3,
                    "evidence_level": "moderate",
                    "personalization_factors": ["cultural_preference", "traditional_diet"]
                })
        
        return recommendations
    
    def _get_exercise_recommendations(self, risk_scores: List[RiskScore], age: int,
                                    lifestyle_factors: Dict[str, Any], 
                                    preferences: Dict[str, Any]) -> List[Dict[str, Any]]:
        """Generate exercise and physical activity recommendations."""
        recommendations = []
        
        current_exercise = lifestyle_factors.get("exercise_frequency", "").lower()
        
        # Base exercise recommendation
        if "never" in current_exercise or "rarely" in current_exercise:
            recommendations.append({
                "category": "exercise",
                "recommendation": "Start with 150 minutes of moderate-intensity aerobic activity per week, such as brisk walking",
                "priority": 5,
                "evidence_level": "high",
                "personalization_factors": ["sedentary_lifestyle", "cardiovascular_health"]
            })
        else:
            recommendations.append({
                "category": "exercise",
                "recommendation": "Continue regular physical activity and consider adding strength training 2-3 times per week",
                "priority": 3,
                "evidence_level": "high",
                "personalization_factors": ["active_lifestyle", "strength_building"]
            })
        
        # Age-specific recommendations
        if age >= 65:
            recommendations.append({
                "category": "exercise",
                "recommendation": "Include balance and flexibility exercises to prevent falls and maintain mobility",
                "priority": 4,
                "evidence_level": "high",
                "personalization_factors": ["senior_age", "fall_prevention"]
            })
        
        # Condition-specific exercise recommendations
        high_risk_diabetes = any(score.condition == ConditionEnum.DIABETES and score.risk_score >= 0.6 
                               for score in risk_scores)
        if high_risk_diabetes:
            recommendations.append({
                "category": "exercise",
                "recommendation": "Engage in both aerobic and resistance training to improve insulin sensitivity",
                "priority": 4,
                "evidence_level": "high",
                "personalization_factors": ["diabetes_prevention", "insulin_sensitivity"]
            })
        
        return recommendations
    
    def _get_weight_management_recommendations(self, bmi: float, 
                                             risk_scores: List[RiskScore]) -> List[Dict[str, Any]]:
        """Generate weight management recommendations based on BMI."""
        recommendations = []
        
        if bmi >= 30:  # Obese
            recommendations.append({
                "category": "weight_management",
                "recommendation": "Aim for 5-10% weight loss through combined diet and exercise approach with medical supervision",
                "priority": 5,
                "evidence_level": "high",
                "personalization_factors": ["obesity", "health_risk_reduction"]
            })
        elif bmi >= 25:  # Overweight
            recommendations.append({
                "category": "weight_management",
                "recommendation": "Target gradual weight loss of 1-2 pounds per week through lifestyle modifications",
                "priority": 4,
                "evidence_level": "high",
                "personalization_factors": ["overweight", "gradual_weight_loss"]
            })
        elif bmi < 18.5:  # Underweight
            recommendations.append({
                "category": "weight_management",
                "recommendation": "Focus on healthy weight gain through nutrient-dense foods and strength training",
                "priority": 3,
                "evidence_level": "moderate",
                "personalization_factors": ["underweight", "healthy_weight_gain"]
            })
        
        return recommendations
    
    def _get_smoking_cessation_recommendations(self, risk_scores: List[RiskScore]) -> List[Dict[str, Any]]:
        """Generate smoking cessation recommendations."""
        return [{
            "category": "smoking_cessation",
            "recommendation": "Quit smoking immediately using evidence-based cessation methods including counseling and pharmacotherapy",
            "priority": 5,
            "evidence_level": "high",
            "personalization_factors": ["smoking_cessation", "health_risk_reduction"]
        }]
    
    def _get_stress_management_recommendations(self, lifestyle_factors: Dict[str, Any],
                                             risk_scores: List[RiskScore]) -> List[Dict[str, Any]]:
        """Generate stress management recommendations."""
        recommendations = []
        
        stress_level = lifestyle_factors.get("stress_level", 0)
        
        if stress_level >= 7:  # High stress
            recommendations.append({
                "category": "stress_management",
                "recommendation": "Practice stress reduction techniques such as meditation, yoga, or deep breathing exercises daily",
                "priority": 4,
                "evidence_level": "moderate",
                "personalization_factors": ["high_stress", "mental_health"]
            })
        elif stress_level >= 5:  # Moderate stress
            recommendations.append({
                "category": "stress_management",
                "recommendation": "Incorporate regular relaxation activities and consider stress management counseling",
                "priority": 3,
                "evidence_level": "moderate",
                "personalization_factors": ["moderate_stress", "wellness"]
            })
        
        return recommendations
    
    def _get_sleep_recommendations(self, lifestyle_factors: Dict[str, Any], age: int) -> List[Dict[str, Any]]:
        """Generate sleep hygiene recommendations."""
        recommendations = []
        
        sleep_hours = lifestyle_factors.get("sleep_hours", 0)
        
        if sleep_hours < 7 or sleep_hours > 9:
            recommendations.append({
                "category": "sleep",
                "recommendation": "Aim for 7-9 hours of quality sleep per night with consistent sleep schedule and good sleep hygiene",
                "priority": 3,
                "evidence_level": "high",
                "personalization_factors": ["sleep_quality", "circadian_rhythm"]
            })
        
        return recommendations
    
    def _get_condition_followups(self, condition: ConditionEnum, risk_score: float, 
                               age: int) -> List[Dict[str, Any]]:
        """Generate condition-specific follow-up recommendations."""
        recommendations = []
        
        if condition == ConditionEnum.DIABETES:
            if risk_score >= 0.8:
                timeframe = "3 months"
                priority = 5
            elif risk_score >= 0.6:
                timeframe = "6 months"
                priority = 4
            else:
                timeframe = "Annual"
                priority = 3
            
            recommendations.extend([
                {
                    "test_type": "hba1c",
                    "timeframe": timeframe,
                    "reason": "Monitor blood sugar control and diabetes risk",
                    "priority": priority
                },
                {
                    "test_type": "fasting_glucose",
                    "timeframe": timeframe,
                    "reason": "Screen for diabetes development",
                    "priority": priority - 1
                }
            ])
        
        elif condition == ConditionEnum.HEART_DISEASE:
            recommendations.extend([
                {
                    "test_type": "lipid_panel",
                    "timeframe": "6 months" if risk_score >= 0.6 else "Annual",
                    "reason": "Monitor cholesterol and cardiovascular risk",
                    "priority": 4 if risk_score >= 0.6 else 3
                },
                {
                    "test_type": "blood_pressure_monitoring",
                    "timeframe": "3 months" if risk_score >= 0.8 else "6 months",
                    "reason": "Monitor cardiovascular health",
                    "priority": 4
                }
            ])
        
        elif condition == ConditionEnum.CKD:
            recommendations.extend([
                {
                    "test_type": "kidney_function_tests",
                    "timeframe": "6 months" if risk_score >= 0.6 else "Annual",
                    "reason": "Monitor kidney function and early kidney disease",
                    "priority": 4 if risk_score >= 0.6 else 3
                },
                {
                    "test_type": "urine_analysis",
                    "timeframe": "6 months",
                    "reason": "Screen for protein in urine",
                    "priority": 3
                }
            ])
        
        return recommendations
    
    def _get_age_based_screening(self, age: int, gender: str) -> List[Dict[str, Any]]:
        """Generate age-based screening recommendations."""
        recommendations = []
        
        # General screening
        if age >= 40:
            recommendations.append({
                "test_type": "annual_physical",
                "timeframe": "Annual",
                "reason": "Comprehensive health assessment",
                "priority": 3
            })
        
        # Cancer screening
        if age >= 50:
            recommendations.append({
                "test_type": "colonoscopy",
                "timeframe": "Every 10 years",
                "reason": "Colorectal cancer screening",
                "priority": 4
            })
        
        if gender == "female" and age >= 40:
            recommendations.append({
                "test_type": "mammogram",
                "timeframe": "Annual",
                "reason": "Breast cancer screening",
                "priority": 4
            })
        
        return recommendations
    
    def _get_preventive_care_recommendations(self, age: int, medical_history: Dict[str, Any],
                                           risk_scores: List[RiskScore]) -> List[Dict[str, Any]]:
        """Generate preventive care recommendations."""
        recommendations = []
        
        # Vaccinations
        recommendations.append({
            "test_type": "annual_flu_vaccine",
            "timeframe": "Annual",
            "reason": "Prevent influenza infection",
            "priority": 2
        })
        
        if age >= 65:
            recommendations.append({
                "test_type": "pneumonia_vaccine",
                "timeframe": "As recommended",
                "reason": "Prevent pneumonia infection in seniors",
                "priority": 3
            })
        
        return recommendations
    
    def _get_educational_resources(self, risk_scores: List[RiskScore], 
                                 language: str = "english") -> List[str]:
        """Get relevant educational resources based on risk profile."""
        resources = []
        
        # Base resources
        resources.append("https://www.heart.org - American Heart Association guidelines")
        resources.append("https://www.diabetes.org - American Diabetes Association resources")
        
        # Condition-specific resources
        for risk_score in risk_scores:
            if risk_score.risk_score >= 0.4:
                condition = risk_score.condition.value
                
                if condition == "diabetes":
                    resources.append("https://www.cdc.gov/diabetes - CDC Diabetes Prevention Program")
                elif condition == "heart_disease":
                    resources.append("https://www.nhlbi.nih.gov - Heart Health Information")
                elif condition == "stroke":
                    resources.append("https://www.stroke.org - Stroke Prevention Guidelines")
        
        # Lifestyle resources
        resources.extend([
            "https://www.choosemyplate.gov - Nutrition Guidelines",
            "https://www.physicalactivityguidelines.org - Exercise Recommendations"
        ])
        
        return resources[:5]  # Limit to top 5 resources
    
    def _generate_personalization_summary(self, patient_data: Dict[str, Any],
                                        preferences: Dict[str, Any],
                                        cultural_considerations: str) -> str:
        """Generate summary of personalization factors applied."""
        summary_parts = []
        
        # Age-based personalization
        age = patient_data.get("age", 0)
        if age >= 65:
            summary_parts.append("adjusted for senior age considerations")
        elif age < 30:
            summary_parts.append("tailored for younger adult health priorities")
        
        # Lifestyle factors
        lifestyle = patient_data.get("lifestyle_factors", {})
        if lifestyle.get("exercise_frequency", "").lower() in ["never", "rarely"]:
            summary_parts.append("focused on initiating physical activity")
        
        # Medical history
        medical_history = patient_data.get("medical_history", {})
        if medical_history.get("smoking_status") == "current":
            summary_parts.append("emphasized smoking cessation")
        
        # Cultural considerations
        if cultural_considerations:
            summary_parts.append(f"adapted for {cultural_considerations} cultural background")
        
        # Preferences
        if preferences:
            summary_parts.append("customized based on patient preferences")
        
        if summary_parts:
            return f"Recommendations {', '.join(summary_parts)}."
        else:
            return "Standard evidence-based recommendations provided."
    
    def _calculate_bmi(self, patient_data: Dict[str, Any]) -> Optional[float]:
        """Calculate BMI from patient vital signs."""
        vital_signs = patient_data.get("vital_signs", {})
        height_cm = vital_signs.get("height_cm")
        weight_kg = vital_signs.get("weight_kg")
        
        if height_cm and weight_kg:
            height_m = height_cm / 100
            return weight_kg / (height_m ** 2)
        return None
    
    def get_recommendation_categories(self) -> Dict[str, Any]:
        """Get information about available recommendation categories."""
        return {
            "lifestyle_categories": [
                "diet", "exercise", "weight_management", "smoking_cessation",
                "stress_management", "sleep", "alcohol_moderation"
            ],
            "follow_up_categories": [
                "laboratory_tests", "imaging_studies", "specialist_consultations",
                "preventive_screening", "vaccination_schedule"
            ],
            "personalization_options": [
                "cultural_background", "dietary_preferences", "exercise_preferences",
                "language_preference", "accessibility_needs"
            ],
            "cultural_adaptations": [
                "mediterranean", "asian", "hispanic", "african", "middle_eastern",
                "vegetarian", "vegan", "religious_dietary_laws"
            ]
        }
    
    def get_educational_resources(self, condition: str = None, language: str = "english",
                                category: str = None) -> List[Dict[str, Any]]:
        """Get filtered educational resources."""
        resources = [
            {
                "title": "Heart Health Guidelines",
                "url": "https://www.heart.org",
                "description": "Comprehensive cardiovascular health information",
                "category": "cardiovascular",
                "language": "english"
            },
            {
                "title": "Diabetes Prevention",
                "url": "https://www.cdc.gov/diabetes",
                "description": "Evidence-based diabetes prevention strategies",
                "category": "diabetes",
                "language": "english"
            },
            {
                "title": "Nutrition Guidelines",
                "url": "https://www.choosemyplate.gov",
                "description": "Dietary guidelines and meal planning resources",
                "category": "nutrition",
                "language": "english"
            }
        ]
        
        # Filter by condition, language, or category if specified
        filtered_resources = resources
        
        if condition:
            filtered_resources = [r for r in filtered_resources if condition.lower() in r["category"]]
        
        if category:
            filtered_resources = [r for r in filtered_resources if category.lower() in r["category"]]
        
        if language != "english":
            # In production, filter by language availability
            pass
        
        return filtered_resources
    
    def _get_default_recommendation_rules(self) -> Dict[str, Any]:
        """Get default recommendation rules if configuration file is not available."""
        return {
            "lifestyle_recommendations": {
                "diet": {
                    "diabetes": "Low-carbohydrate, high-fiber diet",
                    "heart_disease": "Mediterranean-style diet",
                    "general": "Balanced, nutrient-dense diet"
                },
                "exercise": {
                    "sedentary": "150 minutes moderate activity weekly",
                    "active": "Continue current activity plus strength training",
                    "senior": "Include balance and flexibility exercises"
                }
            },
            "follow_up_intervals": {
                "high_risk": "3-6 months",
                "moderate_risk": "6-12 months",
                "low_risk": "Annual"
            }
        }

async def get_recommendation_service() -> RecommendationService:
    """Get the recommendation service instance."""
    return RecommendationService()