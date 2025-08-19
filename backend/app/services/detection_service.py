"""
ML detection service for health risk assessment.
Manages ensemble model predictions with feature preparation and explanation generation.
"""

import logging
from typing import Dict, List, Any, Optional
from datetime import datetime
import numpy as np
import pandas as pd

from app.ml.registry import ModelRegistry
from app.ml.pipelines import FeaturePipeline
from app.ml.explainer import ModelExplainer
from app.core.schemas import ConditionEnum

logger = logging.getLogger(__name__)

class DetectionService:
    """
    ML detection service for multi-condition health risk assessment.
    
    Handles:
    - Feature preparation from patient data
    - Ensemble model predictions
    - Risk score calibration
    - SHAP explanations
    - Confidence interval calculation
    """
    
    def __init__(self, model_registry: ModelRegistry):
        """Initialize detection service with model registry."""
        self.model_registry = model_registry
        self.feature_pipeline = FeaturePipeline()
        self.explainer = ModelExplainer()
        
    async def prepare_features(self, patient_data: Dict[str, Any]) -> pd.DataFrame:
        """
        Prepare features from patient data for ML model input.
        
        Args:
            patient_data: Raw patient data from intake form
            
        Returns:
            DataFrame with prepared features for model inference
        """
        try:
            logger.info("Preparing features from patient data")
            
            # Use feature pipeline to transform patient data
            features_df = await self.feature_pipeline.transform_patient_data(patient_data)
            
            logger.info(f"Prepared {len(features_df.columns)} features for prediction")
            return features_df
            
        except Exception as e:
            logger.error(f"Feature preparation failed: {str(e)}", exc_info=True)
            raise
    
    async def predict_risk(self, condition: ConditionEnum, features: pd.DataFrame,
                          include_explanation: bool = True) -> Dict[str, Any]:
        """
        Predict risk for a specific condition using ensemble models.
        
        Args:
            condition: Medical condition to assess
            features: Prepared feature DataFrame
            include_explanation: Whether to include SHAP explanations
            
        Returns:
            Dictionary containing risk score, confidence interval, and explanations
        """
        try:
            logger.info(f"Predicting risk for condition: {condition.value}")
            
            # Get models for the condition
            models = await self.model_registry.get_condition_models(condition)
            if not models:
                raise ValueError(f"No models available for condition: {condition.value}")
            
            # Get ensemble predictions
            ensemble_predictions = []
            model_details = []
            
            for model_name, model_info in models.items():
                try:
                    model = model_info["model"]
                    calibrator = model_info.get("calibrator")
                    
                    # Get prediction
                    prediction = model.predict_proba(features)[:, 1]  # Probability of positive class
                    
                    # Apply calibration if available
                    if calibrator:
                        prediction = calibrator.predict_proba(prediction.reshape(-1, 1))[:, 1]
                    
                    ensemble_predictions.append(prediction[0])
                    model_details.append({
                        "model_name": model_name,
                        "prediction": float(prediction[0]),
                        "version": model_info.get("version", "1.0.0")
                    })
                    
                except Exception as e:
                    logger.warning(f"Prediction failed for {model_name}: {str(e)}")
                    continue
            
            if not ensemble_predictions:
                raise ValueError(f"All models failed for condition: {condition.value}")
            
            # Calculate ensemble prediction (weighted average)
            ensemble_weights = [0.4, 0.35, 0.25]  # LR, XGBoost, LightGBM weights
            if len(ensemble_predictions) == 3:
                risk_score = np.average(ensemble_predictions, weights=ensemble_weights)
            else:
                risk_score = np.mean(ensemble_predictions)
            
            # Calculate confidence interval
            confidence_interval = self._calculate_confidence_interval(
                ensemble_predictions, risk_score
            )
            
            # Determine risk level
            risk_level = self._determine_risk_level(risk_score)
            
            # Prepare result
            result = {
                "risk_score": float(risk_score),
                "confidence_interval": confidence_interval,
                "risk_level": risk_level,
                "model_version": "ensemble_v1.0.0",
                "model_details": model_details,
                "prediction_timestamp": datetime.utcnow().isoformat()
            }
            
            # Add explanation if requested
            if include_explanation:
                explanation = await self._generate_explanation(
                    condition, features, models, risk_score
                )
                result["explanation"] = explanation
            
            logger.info(f"Risk prediction completed for {condition.value}: {risk_score:.3f}")
            return result
            
        except Exception as e:
            logger.error(f"Risk prediction failed for {condition.value}: {str(e)}", exc_info=True)
            raise
    
    async def predict_multiple_conditions(self, conditions: List[ConditionEnum],
                                        features: pd.DataFrame,
                                        include_explanations: bool = True) -> List[Dict[str, Any]]:
        """
        Predict risk for multiple conditions simultaneously.
        
        Args:
            conditions: List of conditions to assess
            features: Prepared feature DataFrame
            include_explanations: Whether to include SHAP explanations
            
        Returns:
            List of prediction results for each condition
        """
        try:
            logger.info(f"Predicting risk for {len(conditions)} conditions")
            
            results = []
            for condition in conditions:
                try:
                    prediction_result = await self.predict_risk(
                        condition, features, include_explanations
                    )
                    prediction_result["condition"] = condition
                    results.append(prediction_result)
                    
                except Exception as e:
                    logger.error(f"Prediction failed for {condition.value}: {str(e)}")
                    # Add failed prediction result
                    results.append({
                        "condition": condition,
                        "risk_score": 0.0,
                        "confidence_interval": {"lower": 0.0, "upper": 0.0},
                        "risk_level": "unknown",
                        "model_version": "unknown",
                        "error": str(e),
                        "prediction_timestamp": datetime.utcnow().isoformat()
                    })
            
            logger.info(f"Multi-condition prediction completed: {len(results)} results")
            return results
            
        except Exception as e:
            logger.error(f"Multi-condition prediction failed: {str(e)}", exc_info=True)
            raise
    
    async def _generate_explanation(self, condition: ConditionEnum, features: pd.DataFrame,
                                  models: Dict[str, Any], risk_score: float) -> Dict[str, Any]:
        """Generate SHAP explanation for the prediction."""
        try:
            logger.info(f"Generating explanation for {condition.value}")
            
            # Use the primary model (usually XGBoost) for explanation
            primary_model_name = "xgboost"
            if primary_model_name not in models:
                primary_model_name = list(models.keys())[0]
            
            primary_model = models[primary_model_name]["model"]
            
            # Generate SHAP explanation
            shap_explanation = await self.explainer.explain_prediction(
                primary_model, features, condition
            )
            
            # Get top features
            top_features = shap_explanation["top_features"]
            
            # Generate human-readable explanation
            explanation_text = self._generate_explanation_text(
                condition, top_features, risk_score
            )
            
            # Get model performance metrics
            model_card = await self.model_registry.get_model_performance(condition)
            
            return {
                "top_features": top_features,
                "explanation_text": explanation_text,
                "model_card": model_card,
                "shap_values": shap_explanation.get("shap_values", []),
                "base_value": shap_explanation.get("base_value", 0.0)
            }
            
        except Exception as e:
            logger.error(f"Explanation generation failed: {str(e)}")
            return {
                "top_features": [],
                "explanation_text": f"Unable to generate explanation for {condition.value}",
                "model_card": {},
                "error": str(e)
            }
    
    def _calculate_confidence_interval(self, predictions: List[float], 
                                     ensemble_score: float) -> Dict[str, float]:
        """Calculate 95% confidence interval for ensemble prediction."""
        if len(predictions) < 2:
            # Use a conservative confidence interval
            margin = 0.1
            return {
                "lower": max(0.0, ensemble_score - margin),
                "upper": min(1.0, ensemble_score + margin)
            }
        
        # Calculate standard error
        std_error = np.std(predictions) / np.sqrt(len(predictions))
        
        # 95% confidence interval (1.96 * standard error)
        margin = 1.96 * std_error
        
        return {
            "lower": max(0.0, ensemble_score - margin),
            "upper": min(1.0, ensemble_score + margin)
        }
    
    def _determine_risk_level(self, risk_score: float) -> str:
        """Determine risk level category based on risk score."""
        if risk_score >= 0.8:
            return "high"
        elif risk_score >= 0.5:
            return "moderate"
        elif risk_score >= 0.3:
            return "low"
        else:
            return "very_low"
    
    def _generate_explanation_text(self, condition: ConditionEnum, 
                                 top_features: List[Dict[str, Any]], 
                                 risk_score: float) -> str:
        """Generate human-readable explanation text."""
        condition_name = condition.value.replace("_", " ").title()
        
        explanation_parts = []
        
        # Risk level context
        if risk_score >= 0.8:
            explanation_parts.append(f"High risk for {condition_name} identified.")
        elif risk_score >= 0.5:
            explanation_parts.append(f"Moderate risk for {condition_name} detected.")
        else:
            explanation_parts.append(f"Low to moderate risk for {condition_name}.")
        
        # Top contributing factors
        if top_features:
            positive_factors = [f for f in top_features[:3] if f.get("impact_direction") == "positive"]
            negative_factors = [f for f in top_features[:3] if f.get("impact_direction") == "negative"]
            
            if positive_factors:
                factor_names = [self._format_feature_name(f["feature_name"]) for f in positive_factors]
                explanation_parts.append(f"Key risk factors: {', '.join(factor_names)}.")
            
            if negative_factors:
                factor_names = [self._format_feature_name(f["feature_name"]) for f in negative_factors]
                explanation_parts.append(f"Protective factors: {', '.join(factor_names)}.")
        
        # Recommendation context
        if risk_score >= 0.8:
            explanation_parts.append("Recommend immediate medical consultation.")
        elif risk_score >= 0.5:
            explanation_parts.append("Consider medical evaluation and lifestyle modifications.")
        else:
            explanation_parts.append("Continue monitoring and maintain healthy lifestyle.")
        
        return " ".join(explanation_parts)
    
    def _format_feature_name(self, feature_name: str) -> str:
        """Format feature name for human readability."""
        # Convert feature names to readable format
        name_mappings = {
            "age": "Age",
            "bmi": "BMI",
            "blood_pressure_systolic": "Systolic Blood Pressure",
            "blood_pressure_diastolic": "Diastolic Blood Pressure",
            "glucose_fasting": "Fasting Glucose",
            "cholesterol_total": "Total Cholesterol",
            "hba1c": "HbA1c",
            "smoking_current": "Current Smoking",
            "exercise_frequency": "Exercise Frequency",
            "family_history_diabetes": "Family History of Diabetes",
            "family_history_heart_disease": "Family History of Heart Disease"
        }
        
        return name_mappings.get(feature_name, feature_name.replace("_", " ").title())
    
    def get_timestamp(self) -> str:
        """Get current timestamp for results."""
        return datetime.utcnow().isoformat()
    
    async def validate_features(self, features: pd.DataFrame, 
                              condition: ConditionEnum) -> Dict[str, Any]:
        """Validate features for a specific condition's models."""
        try:
            # Get expected features for the condition
            expected_features = await self.model_registry.get_expected_features(condition)
            
            if not expected_features:
                return {"valid": False, "error": "No feature schema available"}
            
            # Check for missing features
            missing_features = set(expected_features) - set(features.columns)
            extra_features = set(features.columns) - set(expected_features)
            
            validation_result = {
                "valid": len(missing_features) == 0,
                "missing_features": list(missing_features),
                "extra_features": list(extra_features),
                "feature_count": len(features.columns),
                "expected_count": len(expected_features)
            }
            
            if missing_features:
                validation_result["error"] = f"Missing required features: {missing_features}"
            
            return validation_result
            
        except Exception as e:
            logger.error(f"Feature validation failed: {str(e)}")
            return {"valid": False, "error": str(e)}

async def get_detection_service() -> DetectionService:
    """Get the detection service instance."""
    return DetectionService()