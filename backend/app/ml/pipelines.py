"""
Feature engineering and preprocessing pipelines for ML models.
Standardized feature transformation for consistent model input.
"""

import logging
from typing import Dict, Any, List, Optional
import numpy as np
import pandas as pd
from sklearn.preprocessing import StandardScaler, RobustScaler, LabelEncoder
from sklearn.impute import SimpleImputer

logger = logging.getLogger(__name__)

class FeaturePipeline:
    """Feature engineering and preprocessing pipeline."""
    
    def __init__(self):
        """Initialize feature pipeline components."""
        self.scalers = {}
        self.imputers = {}
        self.encoders = {}
        self.feature_order = []
        self.is_fitted = False
    
    async def transform(self, features: Dict[str, Any]) -> Dict[str, Any]:
        """Transform raw features into model-ready format."""
        try:
            logger.debug(f"Transforming {len(features)} raw features")
            
            # Convert to DataFrame for easier processing
            df = pd.DataFrame([features])
            
            # Handle missing values
            df = self._handle_missing_values(df)
            
            # Apply feature engineering
            df = self._engineer_features(df)
            
            # Normalize/scale features
            df = self._scale_features(df)
            
            # Convert back to dictionary
            transformed_features = df.iloc[0].to_dict()
            
            logger.debug(f"Feature transformation completed: {len(transformed_features)} features")
            return transformed_features
            
        except Exception as e:
            logger.error(f"Feature transformation failed: {str(e)}", exc_info=True)
            # Return original features if transformation fails
            return features
    
    def _handle_missing_values(self, df: pd.DataFrame) -> pd.DataFrame:
        """Handle missing values with appropriate imputation strategies."""
        # Separate numeric and categorical columns
        numeric_cols = df.select_dtypes(include=[np.number]).columns
        categorical_cols = df.select_dtypes(exclude=[np.number]).columns
        
        # Impute numeric values with median (more robust than mean)
        for col in numeric_cols:
            if df[col].isna().any():
                if col in ['age', 'bmi', 'bp_systolic', 'bp_diastolic']:
                    # Use population means for key vital metrics
                    defaults = {
                        'age': 45.0,
                        'bmi': 25.0,
                        'bp_systolic': 120.0,
                        'bp_diastolic': 80.0
                    }
                    df[col].fillna(defaults.get(col, df[col].median()), inplace=True)
                else:
                    df[col].fillna(df[col].median(), inplace=True)
        
        # Impute categorical values with mode or default
        for col in categorical_cols:
            if df[col].isna().any():
                df[col].fillna('unknown', inplace=True)
        
        return df
    
    def _engineer_features(self, df: pd.DataFrame) -> pd.DataFrame:
        """Apply feature engineering transformations."""
        # BMI categories
        if 'bmi' in df.columns:
            df['bmi_category_underweight'] = (df['bmi'] < 18.5).astype(float)
            df['bmi_category_normal'] = ((df['bmi'] >= 18.5) & (df['bmi'] < 25)).astype(float)
            df['bmi_category_overweight'] = ((df['bmi'] >= 25) & (df['bmi'] < 30)).astype(float)
            df['bmi_category_obese'] = (df['bmi'] >= 30).astype(float)
        
        # Blood pressure categories
        if 'bp_systolic' in df.columns and 'bp_diastolic' in df.columns:
            df['bp_category_normal'] = ((df['bp_systolic'] < 120) & (df['bp_diastolic'] < 80)).astype(float)
            df['bp_category_elevated'] = ((df['bp_systolic'] >= 120) & (df['bp_systolic'] < 130) & (df['bp_diastolic'] < 80)).astype(float)
            df['bp_category_stage1'] = (((df['bp_systolic'] >= 130) & (df['bp_systolic'] < 140)) | ((df['bp_diastolic'] >= 80) & (df['bp_diastolic'] < 90))).astype(float)
            df['bp_category_stage2'] = ((df['bp_systolic'] >= 140) | (df['bp_diastolic'] >= 90)).astype(float)
        
        # Age groups
        if 'age' in df.columns:
            df['age_group_young'] = (df['age'] < 30).astype(float)
            df['age_group_middle'] = ((df['age'] >= 30) & (df['age'] < 60)).astype(float)
            df['age_group_senior'] = (df['age'] >= 60).astype(float)
            
            # Age-squared for non-linear relationships
            df['age_squared'] = df['age'] ** 2
        
        # Lab value ratios and combinations
        if 'cholesterol_total' in df.columns and 'cholesterol_hdl' in df.columns:
            df['cholesterol_ratio'] = df['cholesterol_total'] / (df['cholesterol_hdl'] + 1e-8)  # Avoid division by zero
        
        if 'glucose_fasting' in df.columns and 'hba1c' in df.columns:
            df['glucose_hba1c_product'] = df['glucose_fasting'] * df['hba1c']
        
        # Risk factor combinations
        risk_factors = []
        if 'current_smoker' in df.columns:
            risk_factors.append('current_smoker')