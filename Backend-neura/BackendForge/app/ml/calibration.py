"""
Model calibration for probability calibration of ML predictions.
Implements Platt scaling and Isotonic regression for better probability estimates.
"""

import logging
from typing import Dict, Any, Optional, List, Tuple
import numpy as np
from sklearn.calibration import CalibratedClassifierCV, calibration_curve
from sklearn.isotonic import IsotonicRegression
from sklearn.linear_model import LogisticRegression
from sklearn.model_selection import cross_val_predict
import joblib
from pathlib import Path

from app.core.config import settings
from app.core.schemas import ConditionEnum

logger = logging.getLogger(__name__)

class ModelCalibrator:
    """
    Model calibration utilities for improving probability estimates.
    
    Provides:
    - Platt scaling (sigmoid) calibration
    - Isotonic regression calibration
    - Calibration curve analysis
    - Cross-validation based calibration
    """
    
    def __init__(self, method: str = "isotonic"):
        """
        Initialize calibrator.
        
        Args:
            method: Calibration method ('isotonic' or 'sigmoid')
        """
        self.method = method
        self.calibrators = {}
        
    def calibrate_model(self, model: Any, X_cal: np.ndarray, y_cal: np.ndarray,
                       cv: int = 3) -> Any:
        """
        Calibrate a model using cross-validation.
        
        Args:
            model: Trained model to calibrate
            X_cal: Calibration features
            y_cal: Calibration labels
            cv: Number of CV folds
            
        Returns:
            Calibrated classifier
        """
        try:
            logger.info(f"Calibrating model using {self.method} method with {cv}-fold CV")
            
            # Create calibrated classifier
            calibrated_clf = CalibratedClassifierCV(
                model, 
                method=self.method, 
                cv=cv
            )
            
            # Fit calibrator
            calibrated_clf.fit(X_cal, y_cal)
            
            logger.info("Model calibration completed successfully")
            return calibrated_clf
            
        except Exception as e:
            logger.error(f"Model calibration failed: {str(e)}", exc_info=True)
            raise
    
    def evaluate_calibration(self, model: Any, X_test: np.ndarray, y_test: np.ndarray,
                           n_bins: int = 10) -> Dict[str, Any]:
        """
        Evaluate calibration quality of a model.
        
        Args:
            model: Model to evaluate
            X_test: Test features
            y_test: Test labels
            n_bins: Number of bins for calibration curve
            
        Returns:
            Dictionary with calibration metrics
        """
        try:
            # Get predicted probabilities
            if hasattr(model, 'predict_proba'):
                y_prob = model.predict_proba(X_test)[:, 1]
            else:
                y_prob = model.predict(X_test)
            
            # Calculate calibration curve
            fraction_of_positives, mean_predicted_value = calibration_curve(
                y_test, y_prob, n_bins=n_bins
            )
            
            # Calculate Brier score (lower is better)
            brier_score = np.mean((y_prob - y_test) ** 2)
            
            # Calculate calibration error (Expected Calibration Error)
            bin_boundaries = np.linspace(0, 1, n_bins + 1)
            bin_lowers = bin_boundaries[:-1]
            bin_uppers = bin_boundaries[1:]
            
            ece = 0
            for bin_lower, bin_upper in zip(bin_lowers, bin_uppers):
                in_bin = (y_prob > bin_lower) & (y_prob <= bin_upper)
                prop_in_bin = in_bin.mean()
                
                if prop_in_bin > 0:
                    accuracy_in_bin = y_test[in_bin].mean()
                    avg_confidence_in_bin = y_prob[in_bin].mean()
                    ece += np.abs(avg_confidence_in_bin - accuracy_in_bin) * prop_in_bin
            
            # Calculate Maximum Calibration Error
            mce = 0
            for bin_lower, bin_upper in zip(bin_lowers, bin_uppers):
                in_bin = (y_prob > bin_lower) & (y_prob <= bin_upper)
                prop_in_bin = in_bin.mean()
                
                if prop_in_bin > 0:
                    accuracy_in_bin = y_test[in_bin].mean()
                    avg_confidence_in_bin = y_prob[in_bin].mean()
                    mce = max(mce, np.abs(avg_confidence_in_bin - accuracy_in_bin))
            
            return {
                "brier_score": float(brier_score),
                "expected_calibration_error": float(ece),
                "maximum_calibration_error": float(mce),
                "fraction_of_positives": fraction_of_positives.tolist(),
                "mean_predicted_value": mean_predicted_value.tolist(),
                "calibration_quality": self._assess_calibration_quality(ece, mce)
            }
            
        except Exception as e:
            logger.error(f"Calibration evaluation failed: {str(e)}", exc_info=True)
            return {"error": str(e)}
    
    def _assess_calibration_quality(self, ece: float, mce: float) -> str:
        """Assess calibration quality based on ECE and MCE."""
        if ece < 0.05 and mce < 0.1:
            return "excellent"
        elif ece < 0.1 and mce < 0.2:
            return "good"
        elif ece < 0.15 and mce < 0.3:
            return "fair"
        else:
            return "poor"
    
    def create_temperature_scaling_calibrator(self, logits: np.ndarray, 
                                            labels: np.ndarray) -> LogisticRegression:
        """
        Create temperature scaling calibrator (Platt scaling variant).
        
        Args:
            logits: Model logits or uncalibrated probabilities
            labels: True labels
            
        Returns:
            Fitted temperature scaling model
        """
        try:
            # Convert probabilities to logits if needed
            if np.all((logits >= 0) & (logits <= 1)):
                # Convert probabilities to logits
                epsilon = 1e-7
                logits = np.log(np.clip(logits, epsilon, 1 - epsilon) / 
                               np.clip(1 - logits, epsilon, 1 - epsilon))
            
            # Fit logistic regression for temperature scaling
            temp_scaler = LogisticRegression()
            temp_scaler.fit(logits.reshape(-1, 1), labels)
            
            logger.info("Temperature scaling calibrator created")
            return temp_scaler
            
        except Exception as e:
            logger.error(f"Temperature scaling creation failed: {str(e)}")
            raise
    
    def apply_temperature_scaling(self, calibrator: LogisticRegression, 
                                logits: np.ndarray) -> np.ndarray:
        """
        Apply temperature scaling to logits.
        
        Args:
            calibrator: Fitted temperature scaling model
            logits: Uncalibrated logits or probabilities
            
        Returns:
            Calibrated probabilities
        """
        try:
            # Convert probabilities to logits if needed
            if np.all((logits >= 0) & (logits <= 1)):
                epsilon = 1e-7
                logits = np.log(np.clip(logits, epsilon, 1 - epsilon) / 
                               np.clip(1 - logits, epsilon, 1 - epsilon))
            
            # Apply temperature scaling
            calibrated_probs = calibrator.predict_proba(logits.reshape(-1, 1))[:, 1]
            
            return calibrated_probs
            
        except Exception as e:
            logger.error(f"Temperature scaling application failed: {str(e)}")
            raise
    
    def save_calibrator(self, calibrator: Any, condition: ConditionEnum, 
                       model_name: str, save_path: Optional[Path] = None) -> bool:
        """
        Save calibrator to disk.
        
        Args:
            calibrator: Calibrator to save
            condition: Medical condition
            model_name: Name of the base model
            save_path: Optional custom save path
            
        Returns:
            Success status
        """
        try:
            if save_path is None:
                save_path = Path(settings.MODEL_REGISTRY_PATH) / condition.value / "calibrators"
            
            save_path.mkdir(parents=True, exist_ok=True)
            
            calibrator_file = save_path / f"{model_name}_calibrator.pkl"
            joblib.dump(calibrator, calibrator_file)
            
            logger.info(f"Calibrator saved: {calibrator_file}")
            return True
            
        except Exception as e:
            logger.error(f"Failed to save calibrator: {str(e)}")
            return False
    
    def load_calibrator(self, condition: ConditionEnum, model_name: str,
                       load_path: Optional[Path] = None) -> Optional[Any]:
        """
        Load calibrator from disk.
        
        Args:
            condition: Medical condition
            model_name: Name of the base model
            load_path: Optional custom load path
            
        Returns:
            Loaded calibrator or None if not found
        """
        try:
            if load_path is None:
                load_path = Path(settings.MODEL_REGISTRY_PATH) / condition.value / "calibrators"
            
            calibrator_file = load_path / f"{model_name}_calibrator.pkl"
            
            if not calibrator_file.exists():
                logger.warning(f"Calibrator not found: {calibrator_file}")
                return None
            
            calibrator = joblib.load(calibrator_file)
            logger.info(f"Calibrator loaded: {calibrator_file}")
            return calibrator
            
        except Exception as e:
            logger.error(f"Failed to load calibrator: {str(e)}")
            return None
    
    def batch_calibrate_models(self, models: Dict[str, Any], 
                             X_cal: np.ndarray, y_cal: np.ndarray,
                             condition: ConditionEnum) -> Dict[str, Any]:
        """
        Calibrate multiple models for a condition.
        
        Args:
            models: Dictionary of models to calibrate
            X_cal: Calibration features
            y_cal: Calibration labels
            condition: Medical condition
            
        Returns:
            Dictionary of calibrated models
        """
        calibrated_models = {}
        
        for model_name, model in models.items():
            try:
                logger.info(f"Calibrating {model_name} for {condition.value}")
                
                # Calibrate model
                calibrated_model = self.calibrate_model(model, X_cal, y_cal)
                calibrated_models[model_name] = calibrated_model
                
                # Evaluate calibration
                evaluation = self.evaluate_calibration(calibrated_model, X_cal, y_cal)
                logger.info(f"Calibration quality for {model_name}: {evaluation.get('calibration_quality', 'unknown')}")
                
                # Save calibrator
                self.save_calibrator(calibrated_model, condition, model_name)
                
            except Exception as e:
                logger.error(f"Failed to calibrate {model_name}: {str(e)}")
                # Keep original model if calibration fails
                calibrated_models[model_name] = model
        
        return calibrated_models
    
    def compare_calibration_methods(self, model: Any, X_cal: np.ndarray, y_cal: np.ndarray,
                                  X_test: np.ndarray, y_test: np.ndarray) -> Dict[str, Dict[str, Any]]:
        """
        Compare different calibration methods on the same model.
        
        Args:
            model: Base model to calibrate
            X_cal: Calibration features
            y_cal: Calibration labels
            X_test: Test features
            y_test: Test labels
            
        Returns:
            Comparison results for different methods
        """
        methods = ["sigmoid", "isotonic"]
        results = {}
        
        for method in methods:
            try:
                # Create calibrator with specific method
                calibrator = ModelCalibrator(method=method)
                
                # Calibrate model
                calibrated_model = calibrator.calibrate_model(model, X_cal, y_cal)
                
                # Evaluate calibration
                evaluation = calibrator.evaluate_calibration(calibrated_model, X_test, y_test)
                
                results[method] = evaluation
                logger.info(f"Calibration method {method}: ECE = {evaluation.get('expected_calibration_error', 'N/A'):.4f}")
                
            except Exception as e:
                logger.error(f"Failed to evaluate {method} calibration: {str(e)}")
                results[method] = {"error": str(e)}
        
        return results
    
    def get_optimal_calibration_method(self, comparison_results: Dict[str, Dict[str, Any]]) -> str:
        """
        Determine optimal calibration method from comparison results.
        
        Args:
            comparison_results: Results from compare_calibration_methods
            
        Returns:
            Best method name
        """
        valid_results = {k: v for k, v in comparison_results.items() if "error" not in v}
        
        if not valid_results:
            logger.warning("No valid calibration results, defaulting to isotonic")
            return "isotonic"
        
        # Choose method with lowest Expected Calibration Error
        best_method = min(
            valid_results.keys(),
            key=lambda method: valid_results[method].get("expected_calibration_error", float("inf"))
        )
        
        logger.info(f"Optimal calibration method: {best_method}")
        return best_method
    
    def create_ensemble_calibrator(self, ensemble_predictions: np.ndarray,
                                 true_labels: np.ndarray) -> IsotonicRegression:
        """
        Create calibrator specifically for ensemble predictions.
        
        Args:
            ensemble_predictions: Uncalibrated ensemble predictions
            true_labels: True labels
            
        Returns:
            Fitted ensemble calibrator
        """
        try:
            calibrator = IsotonicRegression(out_of_bounds="clip")
            calibrator.fit(ensemble_predictions, true_labels)
            
            logger.info("Ensemble calibrator created successfully")
            return calibrator
            
        except Exception as e:
            logger.error(f"Ensemble calibrator creation failed: {str(e)}")
            raise
