"""
Mock model generator for development and testing.
Creates realistic mock models that behave like trained ML models.
"""

import logging
from typing import Dict, Any, List
import numpy as np
from datetime import datetime
from sklearn.ensemble import RandomForestClassifier
from sklearn.linear_model import LogisticRegression
from sklearn.calibration import CalibratedClassifierCV
from sklearn.datasets import make_classification
import joblib

from app.core.schemas import ConditionEnum

logger = logging.getLogger(__name__)

class MockModelGenerator:
    """
    Generator for mock ML models that behave realistically.
    
    Creates trained models with realistic performance characteristics
    for development, testing, and demonstration purposes.
    """
    
    def __init__(self):
        """Initialize mock model generator."""
        self.random_state = 42
        
    async def create_condition_models(self, condition: ConditionEnum) -> Dict[str, Any]:
        """
        Create complete set of models for a medical condition.
        
        Args:
            condition: Medical condition to create models for
            
        Returns:
            Dictionary containing models, calibrators, and metadata
        """
        try:
            logger.info(f"Creating mock models for {condition.value}")
            
            # Generate synthetic training data
            X, y = self._generate_synthetic_health_data(condition)
            
            # Create ensemble models
            models = {}
            calibrators = {}
            
            # Logistic Regression
            lr_model = LogisticRegression(random_state=self.random_state)
            lr_model.fit(X, y)
            models["logistic_regression"] = {
                "model": lr_model,
                "version": "1.0.0-mock",
                "loaded_at": datetime.utcnow().isoformat(),
                "type": "sklearn_logistic_regression"
            }
            
            # Random Forest (as XGBoost substitute)
            rf_model = RandomForestClassifier(
                n_estimators=100,
                max_depth=6,
                random_state=self.random_state
            )
            rf_model.fit(X, y)
            models["xgboost"] = {
                "model": rf_model,
                "version": "1.0.0-mock",
                "loaded_at": datetime.utcnow().isoformat(),
                "type": "sklearn_random_forest"
            }
            
            # Another Random Forest (as LightGBM substitute)
            rf_model2 = RandomForestClassifier(
                n_estimators=80,
                max_depth=5,
                min_samples_split=5,
                random_state=self.random_state + 1
            )
            rf_model2.fit(X, y)
            models["lightgbm"] = {
                "model": rf_model2,
                "version": "1.0.0-mock",
                "loaded_at": datetime.utcnow().isoformat(),
                "type": "sklearn_random_forest"
            }
            
            # Create calibrators
            for model_name, model_info in models.items():
                try:
                    calibrated_clf = CalibratedClassifierCV(
                        model_info["model"], 
                        method="isotonic", 
                        cv=3
                    )
                    calibrated_clf.fit(X, y)
                    calibrators[model_name] = calibrated_clf
                except Exception as e:
                    logger.warning(f"Failed to create calibrator for {model_name}: {str(e)}")
            
            # Generate metadata
            metadata = self._generate_model_metadata(condition, models)
            
            result = {
                "models": models,
                "calibrators": calibrators,
                "metadata": metadata
            }
            
            logger.info(f"Mock models created for {condition.value}: {len(models)} models")
            return result
            
        except Exception as e:
            logger.error(f"Mock model creation failed for {condition.value}: {str(e)}")
            raise
    
    def _generate_synthetic_health_data(self, condition: ConditionEnum) -> tuple:
        """Generate synthetic health data for model training."""
        n_samples = 1000
        n_features = 15
        
        # Create base synthetic data
        X, y = make_classification(
            n_samples=n_samples,
            n_features=n_features,
            n_informative=10,
            n_redundant=3,
            n_classes=2,
            class_sep=1.0,
            random_state=self.random_state
        )
        
        # Modify features to be more health-realistic
        X = self._make_health_realistic(X, condition)
        
        # Adjust class balance based on condition prevalence
        prevalence = self._get_condition_prevalence(condition)
        y = self._adjust_prevalence(y, prevalence)
        
        return X, y
    
    def _make_health_realistic(self, X: np.ndarray, condition: ConditionEnum) -> np.ndarray:
        """Transform synthetic data to be more health-realistic."""
        # Scale features to realistic health ranges
        X_realistic = X.copy()
        
        # Age (feature 0): 18-90 years
        X_realistic[:, 0] = np.clip(X_realistic[:, 0] * 15 + 50, 18, 90)
        
        # BMI (feature 1): 15-50
        X_realistic[:, 1] = np.clip(np.abs(X_realistic[:, 1]) * 8 + 22, 15, 50)
        
        # Systolic BP (feature 2): 90-200 mmHg
        X_realistic[:, 2] = np.clip(np.abs(X_realistic[:, 2]) * 25 + 120, 90, 200)
        
        # Diastolic BP (feature 3): 60-120 mmHg
        X_realistic[:, 3] = np.clip(np.abs(X_realistic[:, 3]) * 15 + 80, 60, 120)
        
        # Total Cholesterol (feature 4): 120-350 mg/dL
        X_realistic[:, 4] = np.clip(np.abs(X_realistic[:, 4]) * 50 + 180, 120, 350)
        
        # HDL Cholesterol (feature 5): 20-100 mg/dL
        X_realistic[:, 5] = np.clip(np.abs(X_realistic[:, 5]) * 20 + 45, 20, 100)
        
        # Fasting Glucose (feature 6): 70-300 mg/dL
        X_realistic[:, 6] = np.clip(np.abs(X_realistic[:, 6]) * 40 + 90, 70, 300)
        
        # HbA1c (feature 7): 4-14%
        X_realistic[:, 7] = np.clip(np.abs(X_realistic[:, 7]) * 2 + 5.5, 4, 14)
        
        # Binary features (8-14): smoking, family history, etc.
        for i in range(8, min(X_realistic.shape[1], 15)):
            X_realistic[:, i] = (X_realistic[:, i] > 0).astype(float)
        
        return X_realistic
    
    def _get_condition_prevalence(self, condition: ConditionEnum) -> float:
        """Get realistic prevalence for medical conditions."""
        prevalences = {
            ConditionEnum.DIABETES: 0.11,      # 11% prevalence
            ConditionEnum.HEART_DISEASE: 0.06,  # 6% prevalence
            ConditionEnum.STROKE: 0.03,         # 3% prevalence
            ConditionEnum.CKD: 0.15,           # 15% prevalence
            ConditionEnum.LIVER_DISEASE: 0.04,  # 4% prevalence
            ConditionEnum.ANEMIA: 0.25,        # 25% prevalence
            ConditionEnum.THYROID: 0.12        # 12% prevalence
        }
        return prevalences.get(condition, 0.10)
    
    def _adjust_prevalence(self, y: np.ndarray, target_prevalence: float) -> np.ndarray:
        """Adjust class balance to match target prevalence."""
        current_prevalence = np.mean(y)
        
        if abs(current_prevalence - target_prevalence) < 0.05:
            return y  # Close enough
        
        n_positive_needed = int(len(y) * target_prevalence)
        n_positive_current = np.sum(y)
        
        if n_positive_needed > n_positive_current:
            # Need more positive cases
            negative_indices = np.where(y == 0)[0]
            flip_indices = np.random.choice(
                negative_indices, 
                size=min(n_positive_needed - n_positive_current, len(negative_indices)),
                replace=False
            )
            y[flip_indices] = 1
        else:
            # Need fewer positive cases
            positive_indices = np.where(y == 1)[0]
            flip_indices = np.random.choice(
                positive_indices,
                size=min(n_positive_current - n_positive_needed, len(positive_indices)),
                replace=False
            )
            y[flip_indices] = 0
        
        return y
    
    def _generate_model_metadata(self, condition: ConditionEnum, 
                               models: Dict[str, Any]) -> Dict[str, Any]:
        """Generate realistic metadata for mock models."""
        return {
            "condition": condition.value,
            "created_at": datetime.utcnow().isoformat(),
            "last_updated": datetime.utcnow().isoformat(),
            "version": "1.0.0-mock",
            "description": f"Mock ensemble models for {condition.value} risk assessment",
            "model_type": "ensemble",
            "training_samples": 1000,
            "validation_method": "5-fold_cross_validation",
            "expected_features": self._get_feature_names(),
            "performance": self._generate_mock_performance_metrics(),
            "calibration_method": "isotonic",
            "is_mock": True
        }
    
    def _get_feature_names(self) -> List[str]:
        """Get feature names for mock models."""
        return [
            "age",
            "bmi", 
            "bp_systolic",
            "bp_diastolic",
            "cholesterol_total",
            "cholesterol_hdl",
            "glucose_fasting",
            "hba1c",
            "smoking_current",
            "exercise_regular",
            "alcohol_consumption",
            "family_history_diabetes",
            "family_history_heart_disease",
            "gender_male",
            "medication_count"
        ]
    
    def _generate_mock_performance_metrics(self) -> Dict[str, Dict[str, float]]:
        """Generate realistic performance metrics for mock models."""
        base_performance = {
            "logistic_regression": {
                "auc_roc": 0.82,
                "auc_pr": 0.45,
                "accuracy": 0.78,
                "precision": 0.68,
                "recall": 0.72,
                "f1_score": 0.70,
                "specificity": 0.81,
                "balanced_accuracy": 0.77,
                "brier_score": 0.18,
                "log_loss": 0.52
            },
            "xgboost": {
                "auc_roc": 0.86,
                "auc_pr": 0.52,
                "accuracy": 0.81,
                "precision": 0.73,
                "recall": 0.75,
                "f1_score": 0.74,
                "specificity": 0.84,
                "balanced_accuracy": 0.80,
                "brier_score": 0.16,
                "log_loss": 0.48
            },
            "lightgbm": {
                "auc_roc": 0.85,
                "auc_pr": 0.50,
                "accuracy": 0.80,
                "precision": 0.71,
                "recall": 0.74,
                "f1_score": 0.73,
                "specificity": 0.83,
                "balanced_accuracy": 0.79,
                "brier_score": 0.17,
                "log_loss": 0.49
            }
        }
        
        # Add small random variations to make it more realistic
        for model_name, metrics in base_performance.items():
            for metric_name, value in metrics.items():
                noise = np.random.normal(0, 0.01)  # Small random variation
                base_performance[model_name][metric_name] = max(0, min(1, value + noise))
        
        # Add ensemble performance
        base_performance["ensemble"] = {
            "auc_roc": 0.87,
            "auc_pr": 0.54,
            "accuracy": 0.82,
            "precision": 0.75,
            "recall": 0.76,
            "f1_score": 0.76,
            "specificity": 0.85,
            "balanced_accuracy": 0.81,
            "brier_score": 0.15,
            "log_loss": 0.46
        }
        
        return base_performance
    
    async def create_mock_model_files(self, condition: ConditionEnum, 
                                    save_path: str) -> bool:
        """Create and save mock model files to disk."""
        try:
            from pathlib import Path
            import json
            
            # Create models
            model_data = await self.create_condition_models(condition)
            
            # Create directory structure
            condition_path = Path(save_path) / condition.value
            condition_path.mkdir(parents=True, exist_ok=True)
            
            # Save models
            models = model_data["models"]
            for model_name, model_info in models.items():
                model_file = condition_path / f"{model_name}.pkl"
                joblib.dump(model_info["model"], model_file)
                logger.info(f"Saved mock model: {model_file}")
            
            # Save calibrators
            if model_data["calibrators"]:
                calibrator_path = condition_path / "calibrators"
                calibrator_path.mkdir(exist_ok=True)
                
                for model_name, calibrator in model_data["calibrators"].items():
                    calibrator_file = calibrator_path / f"{model_name}_calibrator.pkl"
                    joblib.dump(calibrator, calibrator_file)
                    logger.info(f"Saved mock calibrator: {calibrator_file}")
            
            # Save metadata
            metadata_file = condition_path / "model_metadata.json"
            with open(metadata_file, 'w') as f:
                json.dump(model_data["metadata"], f, indent=2)
                logger.info(f"Saved mock metadata: {metadata_file}")
            
            logger.info(f"Mock model files created for {condition.value}")
            return True
            
        except Exception as e:
            logger.error(f"Failed to create mock model files: {str(e)}")
            return False
    
    async def create_all_mock_models(self, save_path: str) -> Dict[str, bool]:
        """Create mock models for all conditions."""
        results = {}
        
        for condition in ConditionEnum:
            try:
                success = await self.create_mock_model_files(condition, save_path)
                results[condition.value] = success
            except Exception as e:
                logger.error(f"Failed to create mock models for {condition.value}: {str(e)}")
                results[condition.value] = False
        
        return results
