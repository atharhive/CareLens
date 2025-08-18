"""
Model explainability module using SHAP for interpretable ML predictions.
Provides feature importance and prediction explanations for health risk models.
"""

import logging
from typing import Dict, List, Any, Optional, Tuple
import numpy as np
import pandas as pd
from datetime import datetime

# SHAP imports with error handling
try:
    import shap
    SHAP_AVAILABLE = True
except ImportError:
    SHAP_AVAILABLE = False
    logger = logging.getLogger(__name__)
    logger.warning("SHAP not available, using fallback explanation methods")

from app.core.schemas import ConditionEnum
from app.core.config import settings

logger = logging.getLogger(__name__)

class ModelExplainer:
    """
    Model explanation service using SHAP and other interpretability methods.
    
    Provides:
    - SHAP value calculation for feature importance
    - Human-readable explanations
    - Feature interaction analysis
    - Model-specific explanation methods
    """
    
    def __init__(self):
        """Initialize model explainer."""
        self.explainers = {}  # Cache explainers for different models
        self.feature_names = {}  # Feature names for different conditions
        self.explanation_cache = {}  # Cache recent explanations
        
    async def explain_prediction(self, model: Any, features: pd.DataFrame,
                               condition: ConditionEnum, 
                               background_data: Optional[pd.DataFrame] = None) -> Dict[str, Any]:
        """
        Generate explanation for a model prediction.
        
        Args:
            model: Trained model to explain
            features: Input features for prediction
            condition: Medical condition being predicted
            background_data: Optional background dataset for SHAP
            
        Returns:
            Dictionary containing explanation results
        """
        try:
            logger.info(f"Generating explanation for {condition.value}")
            
            if SHAP_AVAILABLE:
                return await self._generate_shap_explanation(
                    model, features, condition, background_data
                )
            else:
                return await self._generate_fallback_explanation(
                    model, features, condition
                )
                
        except Exception as e:
            logger.error(f"Explanation generation failed: {str(e)}", exc_info=True)
            return await self._generate_fallback_explanation(model, features, condition)
    
    async def _generate_shap_explanation(self, model: Any, features: pd.DataFrame,
                                       condition: ConditionEnum,
                                       background_data: Optional[pd.DataFrame] = None) -> Dict[str, Any]:
        """Generate SHAP-based explanation."""
        try:
            # Get or create explainer for this model
            explainer = await self._get_shap_explainer(model, condition, background_data)
            
            # Calculate SHAP values
            shap_values = explainer.shap_values(features)
            
            # Handle different SHAP value formats
            if isinstance(shap_values, list):
                # Binary classification - use positive class
                shap_values = shap_values[1] if len(shap_values) > 1 else shap_values[0]
            
            # Get base value (expected model output)
            if hasattr(explainer, 'expected_value'):
                base_value = explainer.expected_value
                if isinstance(base_value, np.ndarray):
                    base_value = base_value[1] if len(base_value) > 1 else base_value[0]
            else:
                base_value = 0.0
            
            # Get feature names
            feature_names = features.columns.tolist()
            
            # Create feature importance ranking
            if shap_values.ndim > 1:
                # Multiple samples - use first sample
                sample_shap_values = shap_values[0]
            else:
                sample_shap_values = shap_values
            
            feature_importance = []
            for i, (feature_name, shap_value) in enumerate(zip(feature_names, sample_shap_values)):
                feature_importance.append({
                    "feature_name": feature_name,
                    "importance_score": float(shap_value),
                    "feature_value": float(features.iloc[0, i]),
                    "impact_direction": "positive" if shap_value > 0 else "negative"
                })
            
            # Sort by absolute importance
            feature_importance.sort(key=lambda x: abs(x["importance_score"]), reverse=True)
            
            # Get top features
            top_features = feature_importance[:10]  # Top 10 features
            
            return {
                "method": "shap",
                "shap_values": sample_shap_values.tolist(),
                "base_value": float(base_value),
                "top_features": top_features,
                "feature_importance": feature_importance,
                "explanation_timestamp": datetime.utcnow().isoformat()
            }
            
        except Exception as e:
            logger.error(f"SHAP explanation failed: {str(e)}")
            # Fallback to simple explanation
            return await self._generate_fallback_explanation(model, features, condition)
    
    async def _get_shap_explainer(self, model: Any, condition: ConditionEnum,
                                background_data: Optional[pd.DataFrame] = None) -> Any:
        """Get or create SHAP explainer for a model."""
        model_key = f"{condition.value}_{type(model).__name__}"
        
        if model_key not in self.explainers:
            logger.info(f"Creating SHAP explainer for {model_key}")
            
            # Determine appropriate explainer type
            model_type = type(model).__name__.lower()
            
            if "xgb" in model_type or "gradient" in model_type:
                # Tree-based explainer for XGBoost/LightGBM
                explainer = shap.TreeExplainer(model)
                
            elif "random" in model_type or "forest" in model_type:
                # Tree explainer for Random Forest
                explainer = shap.TreeExplainer(model)
                
            elif background_data is not None:
                # Use background data for other models
                background_sample = shap.sample(background_data, min(100, len(background_data)))
                explainer = shap.KernelExplainer(model.predict_proba, background_sample)
                
            else:
                # Create simple background data
                background_sample = await self._create_background_data(condition)
                explainer = shap.KernelExplainer(
                    lambda x: model.predict_proba(x)[:, 1], 
                    background_sample
                )
            
            self.explainers[model_key] = explainer
            logger.info(f"SHAP explainer created for {model_key}")
        
        return self.explainers[model_key]
    
    async def _create_background_data(self, condition: ConditionEnum) -> np.ndarray:
        """Create background data for SHAP explainer."""
        # Create representative background data based on population statistics
        background_samples = []
        
        for _ in range(50):  # Create 50 background samples
            sample = self._generate_representative_sample(condition)
            background_samples.append(sample)
        
        return np.array(background_samples)
    
    def _generate_representative_sample(self, condition: ConditionEnum) -> List[float]:
        """Generate a representative sample for background data."""
        # Use population statistics for common health metrics
        sample = []
        
        # Age (normal distribution around 45)
        sample.append(np.random.normal(45, 15))
        
        # Gender (50/50 split)
        sample.append(np.random.choice([0, 1]))
        
        # BMI (normal distribution around 26)
        sample.append(np.random.normal(26, 5))
        
        # Blood pressure systolic
        sample.append(np.random.normal(125, 20))
        
        # Blood pressure diastolic
        sample.append(np.random.normal(82, 12))
        
        # Add more features based on typical health metrics
        # Total cholesterol
        sample.append(np.random.normal(200, 40))
        
        # HDL cholesterol
        sample.append(np.random.normal(50, 15))
        
        # LDL cholesterol
        sample.append(np.random.normal(130, 35))
        
        # Fasting glucose
        sample.append(np.random.normal(95, 15))
        
        # HbA1c
        sample.append(np.random.normal(5.5, 0.8))
        
        # Binary features (smoking, family history, etc.)
        for _ in range(5):  # 5 binary features
            sample.append(np.random.choice([0, 1], p=[0.7, 0.3]))  # 30% positive rate
        
        return sample
    
    async def _generate_fallback_explanation(self, model: Any, features: pd.DataFrame,
                                           condition: ConditionEnum) -> Dict[str, Any]:
        """Generate fallback explanation when SHAP is not available."""
        try:
            logger.info(f"Generating fallback explanation for {condition.value}")
            
            # Use feature coefficients for linear models
            if hasattr(model, 'coef_'):
                return await self._linear_model_explanation(model, features)
            
            # Use feature importances for tree-based models
            elif hasattr(model, 'feature_importances_'):
                return await self._tree_model_explanation(model, features)
            
            # Generic explanation based on common medical knowledge
            else:
                return await self._generic_medical_explanation(features, condition)
                
        except Exception as e:
            logger.error(f"Fallback explanation failed: {str(e)}")
            return {
                "method": "error_fallback",
                "top_features": [],
                "explanation_text": f"Unable to generate explanation for {condition.value}",
                "error": str(e)
            }
    
    async def _linear_model_explanation(self, model: Any, features: pd.DataFrame) -> Dict[str, Any]:
        """Generate explanation for linear models using coefficients."""
        try:
            coefficients = model.coef_[0] if model.coef_.ndim > 1 else model.coef_
            feature_names = features.columns.tolist()
            
            feature_importance = []
            for i, (feature_name, coef) in enumerate(zip(feature_names, coefficients)):
                feature_value = float(features.iloc[0, i])
                importance_score = coef * feature_value
                
                feature_importance.append({
                    "feature_name": feature_name,
                    "importance_score": float(importance_score),
                    "coefficient": float(coef),
                    "feature_value": feature_value,
                    "impact_direction": "positive" if importance_score > 0 else "negative"
                })
            
            # Sort by absolute importance
            feature_importance.sort(key=lambda x: abs(x["importance_score"]), reverse=True)
            
            return {
                "method": "linear_coefficients",
                "top_features": feature_importance[:10],
                "feature_importance": feature_importance,
                "base_value": float(model.intercept_[0]) if hasattr(model, 'intercept_') else 0.0
            }
            
        except Exception as e:
            logger.error(f"Linear model explanation failed: {str(e)}")
            return {"method": "linear_error", "error": str(e)}
    
    async def _tree_model_explanation(self, model: Any, features: pd.DataFrame) -> Dict[str, Any]:
        """Generate explanation for tree-based models using feature importances."""
        try:
            importances = model.feature_importances_
            feature_names = features.columns.tolist()
            
            feature_importance = []
            for i, (feature_name, importance) in enumerate(zip(feature_names, importances)):
                feature_value = float(features.iloc[0, i])
                
                feature_importance.append({
                    "feature_name": feature_name,
                    "importance_score": float(importance),
                    "feature_value": feature_value,
                    "impact_direction": "positive"  # Tree importances are always positive
                })
            
            # Sort by importance
            feature_importance.sort(key=lambda x: x["importance_score"], reverse=True)
            
            return {
                "method": "tree_importances",
                "top_features": feature_importance[:10],
                "feature_importance": feature_importance,
                "base_value": 0.0
            }
            
        except Exception as e:
            logger.error(f"Tree model explanation failed: {str(e)}")
            return {"method": "tree_error", "error": str(e)}
    
    async def _generic_medical_explanation(self, features: pd.DataFrame, 
                                         condition: ConditionEnum) -> Dict[str, Any]:
        """Generate generic explanation based on medical knowledge."""
        try:
            # Define important features for each condition
            condition_features = {
                ConditionEnum.DIABETES: ["age", "bmi", "glucose_fasting", "hba1c", "family_history_diabetes"],
                ConditionEnum.HEART_DISEASE: ["age", "cholesterol_total", "bp_systolic", "smoking_current", "family_history_heart_disease"],
                ConditionEnum.STROKE: ["age", "bp_systolic", "smoking_current", "diabetes_history", "atrial_fibrillation"],
                ConditionEnum.CKD: ["age", "diabetes_history", "bp_systolic", "kidney_markers"],
                ConditionEnum.LIVER_DISEASE: ["age", "alcohol_consumption", "bmi", "liver_enzymes"],
                ConditionEnum.ANEMIA: ["age", "gender", "iron_levels", "chronic_disease"],
                ConditionEnum.THYROID: ["age", "gender", "family_history_thyroid", "thyroid_markers"]
            }
            
            important_features = condition_features.get(condition, ["age", "bmi", "family_history"])
            available_features = [f for f in important_features if f in features.columns]
            
            top_features = []
            for i, feature_name in enumerate(available_features[:10]):
                feature_value = float(features[feature_name].iloc[0])
                
                # Determine importance based on medical knowledge
                importance_score = self._get_medical_importance(feature_name, feature_value, condition)
                
                top_features.append({
                    "feature_name": feature_name,
                    "importance_score": importance_score,
                    "feature_value": feature_value,
                    "impact_direction": "positive" if importance_score > 0 else "negative"
                })
            
            # Sort by absolute importance
            top_features.sort(key=lambda x: abs(x["importance_score"]), reverse=True)
            
            return {
                "method": "medical_knowledge",
                "top_features": top_features,
                "explanation_text": f"Risk assessment based on clinical risk factors for {condition.value}",
                "base_value": 0.1  # Default base risk
            }
            
        except Exception as e:
            logger.error(f"Generic explanation failed: {str(e)}")
            return {"method": "generic_error", "error": str(e)}
    
    def _get_medical_importance(self, feature_name: str, feature_value: float,
                              condition: ConditionEnum) -> float:
        """Get medical importance score for a feature-value combination."""
        # Simplified medical importance scoring
        importance = 0.0
        
        if "age" in feature_name.lower():
            if condition in [ConditionEnum.DIABETES, ConditionEnum.HEART_DISEASE]:
                importance = max(0, (feature_value - 40) / 40)  # Increase risk with age
            
        elif "bmi" in feature_name.lower():
            if feature_value > 25:
                importance = (feature_value - 25) / 10  # Overweight/obesity
            elif feature_value < 18.5:
                importance = -(18.5 - feature_value) / 5  # Underweight
                
        elif "glucose" in feature_name.lower() or "hba1c" in feature_name.lower():
            if condition == ConditionEnum.DIABETES:
                if "glucose" in feature_name.lower() and feature_value > 100:
                    importance = (feature_value - 100) / 50
                elif "hba1c" in feature_name.lower() and feature_value > 5.7:
                    importance = (feature_value - 5.7) / 2
                    
        elif "bp" in feature_name.lower() or "blood_pressure" in feature_name.lower():
            if feature_value > 140:  # Hypertension
                importance = (feature_value - 140) / 40
                
        elif "smoking" in feature_name.lower():
            if feature_value > 0:  # Current smoker
                importance = 0.3
                
        elif "family_history" in feature_name.lower():
            if feature_value > 0:
                importance = 0.2
        
        return min(max(importance, -1.0), 1.0)  # Clip to [-1, 1]
    
    async def explain_feature_interactions(self, model: Any, features: pd.DataFrame,
                                         condition: ConditionEnum) -> Dict[str, Any]:
        """Analyze feature interactions using SHAP interaction values."""
        if not SHAP_AVAILABLE:
            return {"error": "SHAP not available for interaction analysis"}
        
        try:
            explainer = await self._get_shap_explainer(model, condition)
            
            # Calculate interaction values (only for TreeExplainer)
            if hasattr(explainer, 'shap_interaction_values'):
                interaction_values = explainer.shap_interaction_values(features)
                
                # Find top interactions
                feature_names = features.columns.tolist()
                interactions = []
                
                for i in range(len(feature_names)):
                    for j in range(i + 1, len(feature_names)):
                        interaction_strength = abs(interaction_values[0][i][j])
                        if interaction_strength > 0.01:  # Threshold for significance
                            interactions.append({
                                "feature1": feature_names[i],
                                "feature2": feature_names[j],
                                "interaction_strength": float(interaction_strength),
                                "value1": float(features.iloc[0, i]),
                                "value2": float(features.iloc[0, j])
                            })
                
                # Sort by interaction strength
                interactions.sort(key=lambda x: x["interaction_strength"], reverse=True)
                
                return {
                    "method": "shap_interactions",
                    "top_interactions": interactions[:5],
                    "total_interactions": len(interactions)
                }
            else:
                return {"error": "Interaction values not available for this model type"}
                
        except Exception as e:
            logger.error(f"Feature interaction analysis failed: {str(e)}")
            return {"error": str(e)}
    
    def generate_explanation_text(self, explanation_data: Dict[str, Any],
                                condition: ConditionEnum, risk_score: float) -> str:
        """Generate human-readable explanation text."""
        try:
            top_features = explanation_data.get("top_features", [])
            
            if not top_features:
                return f"Risk assessment for {condition.value.replace('_', ' ')} completed, but detailed explanation is not available."
            
            # Start with risk level
            if risk_score >= 0.8:
                risk_text = "very high risk"
            elif risk_score >= 0.6:
                risk_text = "high risk"
            elif risk_score >= 0.4:
                risk_text = "moderate risk"
            else:
                risk_text = "low risk"
            
            explanation_parts = [
                f"The model indicates {risk_text} for {condition.value.replace('_', ' ')}."
            ]
            
            # Identify contributing factors
            positive_factors = [f for f in top_features[:3] if f.get("impact_direction") == "positive"]
            negative_factors = [f for f in top_features[:3] if f.get("impact_direction") == "negative"]
            
            if positive_factors:
                factor_descriptions = []
                for factor in positive_factors:
                    feature_name = factor["feature_name"].replace("_", " ")
                    factor_descriptions.append(feature_name)
                
                explanation_parts.append(
                    f"Key contributing factors include: {', '.join(factor_descriptions)}."
                )
            
            if negative_factors:
                factor_descriptions = []
                for factor in negative_factors:
                    feature_name = factor["feature_name"].replace("_", " ")
                    factor_descriptions.append(feature_name)
                
                explanation_parts.append(
                    f"Protective factors include: {', '.join(factor_descriptions)}."
                )
            
            # Add recommendation based on risk level
            if risk_score >= 0.8:
                explanation_parts.append("Consider immediate medical consultation.")
            elif risk_score >= 0.6:
                explanation_parts.append("Regular monitoring and medical follow-up recommended.")
            elif risk_score >= 0.4:
                explanation_parts.append("Lifestyle modifications may help reduce risk.")
            else:
                explanation_parts.append("Continue current health practices.")
            
            return " ".join(explanation_parts)
            
        except Exception as e:
            logger.error(f"Explanation text generation failed: {str(e)}")
            return f"Risk assessment completed for {condition.value.replace('_', ' ')}, but explanation text could not be generated."
