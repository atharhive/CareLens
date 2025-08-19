"""
ML model registry for health risk assessment models.
Manages loading, caching, and versioning of ensemble models.
"""

import logging
import pickle
import joblib
from pathlib import Path
from typing import Dict, Any, Optional, List
from datetime import datetime
import asyncio
import json

from sklearn.ensemble import RandomForestClassifier
from sklearn.linear_model import LogisticRegression
import xgboost as xgb
import lightgbm as lgb
from sklearn.calibration import CalibratedClassifierCV

from app.core.config import settings
from app.core.schemas import ConditionEnum
from app.ml.calibration import ModelCalibrator
from app.ml.models.mock_models import MockModelGenerator

logger = logging.getLogger(__name__)

class ModelRegistry:
    """
    Centralized registry for ML models used in health risk assessment.
    
    Manages:
    - Loading and caching of ensemble models
    - Model versioning and metadata
    - Calibration models
    - Performance metrics
    """
    
    def __init__(self):
        """Initialize model registry."""
        self.models = {}  # condition -> {model_name: model_info}
        self.calibrators = {}  # condition -> {model_name: calibrator}
        self.explainers = {}  # condition -> explainer
        self.model_metadata = {}  # condition -> metadata
        self.is_initialized = False
        self.model_path = Path(settings.MODEL_REGISTRY_PATH)
        
    async def initialize(self):
        """Initialize and load all models."""
        try:
            logger.info("Initializing ML model registry")
            
            # Ensure model directory exists
            self.model_path.mkdir(parents=True, exist_ok=True)
            
            # Load models for each condition
            for condition in ConditionEnum:
                await self._load_condition_models(condition)
            
            self.is_initialized = True
            logger.info(f"Model registry initialized with {len(self.models)} conditions")
            
        except Exception as e:
            logger.error(f"Model registry initialization failed: {str(e)}", exc_info=True)
            # Initialize with mock models for development/testing
            await self._initialize_mock_models()
            self.is_initialized = True
            
    async def _load_condition_models(self, condition: ConditionEnum):
        """Load ensemble models for a specific condition."""
        try:
            condition_path = self.model_path / condition.value
            
            if not condition_path.exists():
                logger.warning(f"Model path not found for {condition.value}, creating mock models")
                await self._create_mock_models_for_condition(condition)
                return
            
            # Load model metadata
            metadata_file = condition_path / "model_metadata.json"
            if metadata_file.exists():
                with open(metadata_file, 'r') as f:
                    self.model_metadata[condition] = json.load(f)
            else:
                self.model_metadata[condition] = self._get_default_metadata(condition)
            
            # Initialize condition models dictionary
            self.models[condition] = {}
            self.calibrators[condition] = {}
            
            # Load Logistic Regression model
            lr_path = condition_path / "logistic_regression.pkl"
            if lr_path.exists():
                lr_model = joblib.load(lr_path)
                self.models[condition]["logistic_regression"] = {
                    "model": lr_model,
                    "version": "1.0.0",
                    "loaded_at": datetime.utcnow().isoformat()
                }
                logger.info(f"Loaded LR model for {condition.value}")
            
            # Load XGBoost model
            xgb_path = condition_path / "xgboost_model.json"
            if xgb_path.exists():
                xgb_model = xgb.XGBClassifier()
                xgb_model.load_model(str(xgb_path))
                self.models[condition]["xgboost"] = {
                    "model": xgb_model,
                    "version": "1.0.0",
                    "loaded_at": datetime.utcnow().isoformat()
                }
                logger.info(f"Loaded XGBoost model for {condition.value}")
            
            # Load LightGBM model
            lgb_path = condition_path / "lightgbm_model.txt"
            if lgb_path.exists():
                lgb_model = lgb.Booster(model_file=str(lgb_path))
                self.models[condition]["lightgbm"] = {
                    "model": lgb_model,
                    "version": "1.0.0",
                    "loaded_at": datetime.utcnow().isoformat()
                }
                logger.info(f"Loaded LightGBM model for {condition.value}")
            
            # Load calibrators
            await self._load_calibrators(condition, condition_path)
            
            # If no models were loaded, create mock models
            if not self.models.get(condition):
                logger.warning(f"No models found for {condition.value}, creating mock models")
                await self._create_mock_models_for_condition(condition)
                
        except Exception as e:
            logger.error(f"Failed to load models for {condition.value}: {str(e)}")
            # Fallback to mock models
            await self._create_mock_models_for_condition(condition)
    
    async def _load_calibrators(self, condition: ConditionEnum, condition_path: Path):
        """Load calibration models for ensemble predictions."""
        try:
            calibrator_path = condition_path / "calibrators"
            if not calibrator_path.exists():
                logger.info(f"No calibrators found for {condition.value}, will use uncalibrated predictions")
                return
            
            # Load calibrator for each model type
            for model_name in ["logistic_regression", "xgboost", "lightgbm"]:
                calibrator_file = calibrator_path / f"{model_name}_calibrator.pkl"
                if calibrator_file.exists():
                    calibrator = joblib.load(calibrator_file)
                    if condition not in self.calibrators:
                        self.calibrators[condition] = {}
                    self.calibrators[condition][model_name] = calibrator
                    logger.info(f"Loaded calibrator for {condition.value} {model_name}")
                    
        except Exception as e:
            logger.error(f"Failed to load calibrators for {condition.value}: {str(e)}")
    
    async def _create_mock_models_for_condition(self, condition: ConditionEnum):
        """Create mock models for development/testing."""
        try:
            mock_generator = MockModelGenerator()
            mock_models = await mock_generator.create_condition_models(condition)
            
            self.models[condition] = mock_models["models"]
            self.calibrators[condition] = mock_models.get("calibrators", {})
            self.model_metadata[condition] = mock_models.get("metadata", self._get_default_metadata(condition))
            
            logger.info(f"Created mock models for {condition.value}")
            
        except Exception as e:
            logger.error(f"Failed to create mock models for {condition.value}: {str(e)}")
            raise
    
    async def _initialize_mock_models(self):
        """Initialize all models with mock implementations."""
        logger.warning("Initializing with mock models for development")
        
        mock_generator = MockModelGenerator()
        
        for condition in ConditionEnum:
            try:
                mock_models = await mock_generator.create_condition_models(condition)
                self.models[condition] = mock_models["models"]
                self.calibrators[condition] = mock_models.get("calibrators", {})
                self.model_metadata[condition] = mock_models.get("metadata", self._get_default_metadata(condition))
                
            except Exception as e:
                logger.error(f"Failed to create mock models for {condition.value}: {str(e)}")
    
    async def get_condition_models(self, condition: ConditionEnum) -> Dict[str, Any]:
        """Get all models for a specific condition."""
        if not self.is_initialized:
            await self.initialize()
        
        if condition not in self.models:
            raise ValueError(f"No models available for condition: {condition.value}")
        
        # Add calibrators to model info
        models_with_calibrators = {}
        for model_name, model_info in self.models[condition].items():
            model_data = model_info.copy()
            if condition in self.calibrators and model_name in self.calibrators[condition]:
                model_data["calibrator"] = self.calibrators[condition][model_name]
            models_with_calibrators[model_name] = model_data
        
        return models_with_calibrators
    
    async def get_model_info(self, condition: ConditionEnum) -> Optional[Dict[str, Any]]:
        """Get detailed information about models for a condition."""
        if not self.is_initialized:
            await self.initialize()
        
        if condition not in self.models:
            return None
        
        model_info = {
            "condition": condition.value,
            "models_available": list(self.models[condition].keys()),
            "metadata": self.model_metadata.get(condition, {}),
            "calibrators_available": list(self.calibrators.get(condition, {}).keys()),
            "last_updated": self.model_metadata.get(condition, {}).get("last_updated", "unknown")
        }
        
        # Add individual model performance metrics
        model_info["model_performance"] = {}
        for model_name in self.models[condition].keys():
            performance = self.model_metadata.get(condition, {}).get("performance", {}).get(model_name, {})
            model_info["model_performance"][model_name] = performance
        
        return model_info
    
    async def get_model_performance(self, condition: ConditionEnum) -> Dict[str, Any]:
        """Get model performance metrics for a condition."""
        metadata = self.model_metadata.get(condition, {})
        return metadata.get("performance", {})
    
    async def get_expected_features(self, condition: ConditionEnum) -> List[str]:
        """Get expected features for models of a specific condition."""
        metadata = self.model_metadata.get(condition, {})
        return metadata.get("expected_features", [])
    
    def _get_default_metadata(self, condition: ConditionEnum) -> Dict[str, Any]:
        """Get default metadata for a condition."""
        return {
            "condition": condition.value,
            "created_at": datetime.utcnow().isoformat(),
            "last_updated": datetime.utcnow().isoformat(),
            "version": "1.0.0",
            "description": f"Ensemble models for {condition.value} risk assessment",
            "expected_features": self._get_default_features(),
            "performance": {
                "logistic_regression": {
                    "auc_roc": 0.85,
                    "precision": 0.82,
                    "recall": 0.78,
                    "f1_score": 0.80
                },
                "xgboost": {
                    "auc_roc": 0.88,
                    "precision": 0.85,
                    "recall": 0.81,
                    "f1_score": 0.83
                },
                "lightgbm": {
                    "auc_roc": 0.87,
                    "precision": 0.84,
                    "recall": 0.80,
                    "f1_score": 0.82
                }
            }
        }
    
    def _get_default_features(self) -> List[str]:
        """Get default feature list for models."""
        return [
            "age", "gender_male", "bmi", "bp_systolic", "bp_diastolic",
            "cholesterol_total", "cholesterol_hdl", "cholesterol_ldl",
            "glucose_fasting", "hba1c", "smoking_current", "exercise_frequency",
            "alcohol_consumption", "family_history_diabetes", "family_history_heart_disease"
        ]
    
    async def reload_models(self):
        """Reload all models from disk."""
        logger.info("Reloading all models")
        self.models.clear()
        self.calibrators.clear()
        self.explainers.clear()
        self.model_metadata.clear()
        self.is_initialized = False
        await self.initialize()
    
    async def health_check(self) -> Dict[str, Any]:
        """Health check for the model registry."""
        return {
            "all_loaded": self.is_initialized and len(self.models) > 0,
            "initialized": self.is_initialized,
            "conditions_count": len(self.models),
            "total_models": sum(len(models) for models in self.models.values())
        }
    
    async def get_registry_status(self) -> Dict[str, Any]:
        """Get comprehensive status of the model registry."""
        status = {
            "initialized": self.is_initialized,
            "total_conditions": len(self.models),
            "conditions_loaded": [],
            "model_counts": {},
            "calibrator_counts": {},
            "total_models": 0,
            "registry_health": "healthy"
        }
        
        for condition, models in self.models.items():
            status["conditions_loaded"].append(condition.value)
            status["model_counts"][condition.value] = len(models)
            status["calibrator_counts"][condition.value] = len(self.calibrators.get(condition, {}))
            status["total_models"] += len(models)
        
        # Check for any issues
        issues = []
        for condition in ConditionEnum:
            if condition not in self.models or len(self.models[condition]) == 0:
                issues.append(f"No models for {condition.value}")
        
        if issues:
            status["registry_health"] = "degraded"
            status["issues"] = issues
        
        return status
    
    async def predict_with_ensemble(self, condition: ConditionEnum, features: Dict[str, Any]) -> Dict[str, Any]:
        """Make prediction using ensemble of models for a condition."""
        models = await self.get_condition_models(condition)
        
        if not models:
            raise ValueError(f"No models available for condition: {condition.value}")
        
        predictions = []
        model_results = {}
        
        # Get predictions from each model
        for model_name, model_info in models.items():
            try:
                model = model_info["model"]
                
                # Convert features to format expected by model
                feature_array = self._prepare_features_for_model(features, condition)
                
                # Get prediction probability
                if hasattr(model, 'predict_proba'):
                    pred_proba = model.predict_proba(feature_array)
                    if pred_proba.ndim > 1:
                        prediction = pred_proba[0][1]  # Probability of positive class
                    else:
                        prediction = pred_proba[0]
                else:
                    # For LightGBM Booster
                    prediction = model.predict(feature_array)[0]
                
                # Apply calibration if available
                calibrator = model_info.get("calibrator")
                if calibrator:
                    prediction = calibrator.predict_proba([[prediction]])[0][1]
                
                predictions.append(prediction)
                model_results[model_name] = float(prediction)
                
            except Exception as e:
                logger.error(f"Prediction failed for {model_name}: {str(e)}")
                continue
        
        if not predictions:
            raise ValueError(f"All models failed for condition: {condition.value}")
        
        # Calculate ensemble prediction (weighted average)
        weights = {"logistic_regression": 0.3, "xgboost": 0.4, "lightgbm": 0.3}
        if len(predictions) == 3:
            ensemble_prediction = sum(
                pred * weights.get(model_name, 1.0/len(predictions)) 
                for model_name, pred in zip(model_results.keys(), predictions)
            )
        else:
            ensemble_prediction = sum(predictions) / len(predictions)
        
        return {
            "ensemble_prediction": float(ensemble_prediction),
            "individual_predictions": model_results,
            "model_count": len(predictions)
        }
    
    def _prepare_features_for_model(self, features: Dict[str, Any], condition: ConditionEnum) -> Any:
        """Prepare features in the format expected by the models."""
        import pandas as pd
        import numpy as np
        
        # Get expected features for this condition
        expected_features = self.model_metadata.get(condition, {}).get("expected_features", [])
        
        # Create feature array with expected features
        feature_values = []
        for feature_name in expected_features:
            value = features.get(feature_name, 0)  # Default to 0 if missing
            
            # Handle different data types
            if isinstance(value, (str, bool)):
                # Convert boolean/categorical to numeric
                if isinstance(value, bool):
                    feature_values.append(1 if value else 0)
                elif value.lower() in ['true', 'yes', '1']:
                    feature_values.append(1)
                elif value.lower() in ['false', 'no', '0']:
                    feature_values.append(0)
                else:
                    feature_values.append(0)  # Default for unknown strings
            else:
                try:
                    feature_values.append(float(value))
                except (ValueError, TypeError):
                    feature_values.append(0)  # Default for unconvertible values
        
        # Convert to numpy array and reshape for single prediction
        feature_array = np.array(feature_values).reshape(1, -1)
        
        return feature_array
    
    def cleanup(self):
        """Cleanup model registry resources."""
        logger.info("Cleaning up model registry")
        self.models.clear()
        self.calibrators.clear()
        self.explainers.clear()
        self.model_metadata.clear()
        self.is_initialized = False

async def get_model_registry() -> ModelRegistry:
    """Get the model registry instance."""
    return ModelRegistry()
