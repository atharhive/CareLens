"""
Unit conversion utilities for medical measurements.
Standardizes units across different lab report formats.
"""

import logging
from typing import Dict, Optional, Tuple, Any, List
import re

logger = logging.getLogger(__name__)

class UnitConverter:
    """
    Medical unit converter for standardizing lab values.
    
    Handles conversion between different units commonly used
    in medical laboratory reports.
    """
    
    def __init__(self):
        """Initialize unit converter with conversion factors."""
        self.conversion_factors = self._load_conversion_factors()
        self.standard_units = self._load_standard_units()
        
    def _load_conversion_factors(self) -> Dict[str, Dict[str, Dict[str, float]]]:
        """Load conversion factors for different measurement types."""
        return {
            "glucose": {
                "mg/dL": {"mmol/L": 0.0555, "mg/dL": 1.0},
                "mmol/L": {"mg/dL": 18.018, "mmol/L": 1.0}
            },
            "cholesterol": {
                "mg/dL": {"mmol/L": 0.0259, "mg/dL": 1.0},
                "mmol/L": {"mg/dL": 38.67, "mmol/L": 1.0}
            },
            "triglycerides": {
                "mg/dL": {"mmol/L": 0.0113, "mg/dL": 1.0},
                "mmol/L": {"mg/dL": 88.5, "mmol/L": 1.0}
            },
            "creatinine": {
                "mg/dL": {"μmol/L": 88.4, "mg/dL": 1.0, "umol/L": 88.4},
                "μmol/L": {"mg/dL": 0.0113, "μmol/L": 1.0},
                "umol/L": {"mg/dL": 0.0113, "umol/L": 1.0, "μmol/L": 1.0}
            },
            "urea": {
                "mg/dL": {"mmol/L": 0.357, "mg/dL": 1.0},
                "mmol/L": {"mg/dL": 2.8, "mmol/L": 1.0}
            },
            "bilirubin": {
                "mg/dL": {"μmol/L": 17.1, "mg/dL": 1.0, "umol/L": 17.1},
                "μmol/L": {"mg/dL": 0.0585, "μmol/L": 1.0},
                "umol/L": {"mg/dL": 0.0585, "umol/L": 1.0, "μmol/L": 1.0}
            },
            "protein": {
                "g/dL": {"g/L": 10.0, "g/dL": 1.0},
                "g/L": {"g/dL": 0.1, "g/L": 1.0}
            },
            "hemoglobin": {
                "g/dL": {"g/L": 10.0, "mmol/L": 0.6206, "g/dL": 1.0},
                "g/L": {"g/dL": 0.1, "g/L": 1.0, "mmol/L": 0.06206},
                "mmol/L": {"g/dL": 1.611, "g/L": 16.11, "mmol/L": 1.0}
            },
            "thyroid": {
                "ng/dL": {"nmol/L": 0.01281, "ng/dL": 1.0, "ng/ml": 0.01},
                "nmol/L": {"ng/dL": 78.1, "nmol/L": 1.0},
                "ng/ml": {"ng/dL": 100.0, "ng/ml": 1.0},
                "μg/dL": {"pmol/L": 12.87, "μg/dL": 1.0, "ug/dL": 1.0},
                "ug/dL": {"μg/dL": 1.0, "ug/dL": 1.0},
                "pmol/L": {"μg/dL": 0.0777, "pmol/L": 1.0}
            },
            "vitamin_d": {
                "ng/mL": {"nmol/L": 2.5, "ng/mL": 1.0},
                "nmol/L": {"ng/mL": 0.4, "nmol/L": 1.0}
            },
            "b12": {
                "pg/mL": {"pmol/L": 0.738, "pg/mL": 1.0},
                "pmol/L": {"pg/mL": 1.355, "pmol/L": 1.0}
            }
        }
    
    def _load_standard_units(self) -> Dict[str, str]:
        """Load standard units for different test types."""
        return {
            "glucose_fasting": "mg/dL",
            "glucose_random": "mg/dL",
            "hba1c": "%",
            "cholesterol_total": "mg/dL",
            "cholesterol_hdl": "mg/dL",
            "cholesterol_ldl": "mg/dL",
            "triglycerides": "mg/dL",
            "creatinine": "mg/dL",
            "bun": "mg/dL",
            "hemoglobin": "g/dL",
            "hematocrit": "%",
            "white_blood_cells": "K/μL",
            "platelets": "K/μL",
            "tsh": "mIU/L",
            "t3": "ng/dL",
            "t4": "μg/dL",
            "alt": "U/L",
            "ast": "U/L",
            "bilirubin_total": "mg/dL",
            "albumin": "g/dL"
        }
    
    def convert_to_standard_unit(self, test_name: str, value: float, 
                               current_unit: str) -> Optional[Dict[str, Any]]:
        """
        Convert a lab value to the standard unit for that test.
        
        Args:
            test_name: Name of the lab test
            value: Current value
            current_unit: Current unit of measurement
            
        Returns:
            Dictionary with converted value and unit, or None if conversion not possible
        """
        try:
            # Get standard unit for this test
            standard_unit = self.standard_units.get(test_name)
            if not standard_unit:
                logger.warning(f"No standard unit defined for test: {test_name}")
                return None
            
            # Normalize unit strings
            normalized_current = self._normalize_unit(current_unit)
            normalized_standard = self._normalize_unit(standard_unit)
            
            # If already in standard unit, return as-is
            if normalized_current == normalized_standard:
                return {
                    "value": value,
                    "unit": standard_unit,
                    "converted": False,
                    "original_value": value,
                    "original_unit": current_unit
                }
            
            # Find appropriate conversion category
            conversion_category = self._get_conversion_category(test_name)
            if not conversion_category:
                logger.warning(f"No conversion category found for test: {test_name}")
                return None
            
            # Get conversion factors
            conversions = self.conversion_factors.get(conversion_category, {})
            
            if normalized_current not in conversions:
                logger.warning(f"No conversion available from {normalized_current} for {test_name}")
                return None
            
            # Get conversion factor
            conversion_factor = conversions[normalized_current].get(normalized_standard)
            if conversion_factor is None:
                logger.warning(f"No conversion factor from {normalized_current} to {normalized_standard}")
                return None
            
            # Perform conversion
            converted_value = value * conversion_factor
            
            # Round to appropriate precision
            converted_value = self._round_to_precision(converted_value, test_name)
            
            logger.info(f"Converted {test_name}: {value} {current_unit} → {converted_value} {standard_unit}")
            
            return {
                "value": converted_value,
                "unit": standard_unit,
                "converted": True,
                "original_value": value,
                "original_unit": current_unit,
                "conversion_factor": conversion_factor
            }
            
        except Exception as e:
            logger.error(f"Unit conversion failed for {test_name}: {str(e)}")
            return None
    
    def _normalize_unit(self, unit: str) -> str:
        """Normalize unit string for consistent matching."""
        if not unit:
            return ""
        
        # Convert to lowercase and remove spaces
        normalized = unit.lower().replace(" ", "")
        
        # Handle common variations
        unit_mappings = {
            "mg/dl": "mg/dL",
            "mgdl": "mg/dL",
            "mg%": "mg/dL",
            "g/dl": "g/dL",
            "gdl": "g/dL",
            "g%": "g/dL",
            "ug/dl": "μg/dL",
            "ugdl": "μg/dL",
            "mcg/dl": "μg/dL",
            "ng/dl": "ng/dL",
            "ngdl": "ng/dL",
            "mmol/l": "mmol/L",
            "mmoll": "mmol/L",
            "umol/l": "μmol/L",
            "umoll": "μmol/L",
            "μmol/l": "μmol/L",
            "nmol/l": "nmol/L",
            "nmoll": "nmol/L",
            "pmol/l": "pmol/L",
            "pmoll": "pmol/L",
            "miu/l": "mIU/L",
            "miul": "mIU/L",
            "u/l": "U/L",
            "ul": "U/L",
            "iu/l": "U/L",
            "iul": "U/L",
            "k/ul": "K/μL",
            "k/μl": "K/μL",
            "thousand/ul": "K/μL",
            "thousand/μl": "K/μL",
            "percent": "%",
            "percentage": "%",
            "ng/ml": "ng/mL",
            "ngml": "ng/mL",
            "pg/ml": "pg/mL",
            "pgml": "pg/mL"
        }
        
        return unit_mappings.get(normalized, normalized)
    
    def _get_conversion_category(self, test_name: str) -> Optional[str]:
        """Get the conversion category for a test name."""
        category_mappings = {
            "glucose": ["glucose_fasting", "glucose_random"],
            "cholesterol": ["cholesterol_total", "cholesterol_hdl", "cholesterol_ldl"],
            "triglycerides": ["triglycerides"],
            "creatinine": ["creatinine"],
            "urea": ["bun"],
            "bilirubin": ["bilirubin_total", "bilirubin_direct"],
            "protein": ["albumin", "total_protein"],
            "hemoglobin": ["hemoglobin"],
            "thyroid": ["tsh", "t3", "t4", "free_t3", "free_t4"]
        }
        
        for category, test_list in category_mappings.items():
            if test_name in test_list:
                return category
        
        return None
    
    def _round_to_precision(self, value: float, test_name: str) -> float:
        """Round value to appropriate precision for the test type."""
        # Define precision for different test types
        precision_map = {
            "glucose_fasting": 0,
            "glucose_random": 0,
            "hba1c": 1,
            "cholesterol_total": 0,
            "cholesterol_hdl": 0,
            "cholesterol_ldl": 0,
            "triglycerides": 0,
            "creatinine": 2,
            "bun": 0,
            "hemoglobin": 1,
            "hematocrit": 1,
            "tsh": 3,
            "t3": 0,
            "t4": 1,
            "alt": 0,
            "ast": 0,
            "bilirubin_total": 1,
            "albumin": 1
        }
        
        precision = precision_map.get(test_name, 2)
        return round(value, precision)
    
    def validate_unit(self, test_name: str, unit: str) -> Dict[str, Any]:
        """
        Validate if a unit is appropriate for a given test.
        
        Args:
            test_name: Name of the lab test
            unit: Unit to validate
            
        Returns:
            Dictionary with validation results
        """
        try:
            normalized_unit = self._normalize_unit(unit)
            standard_unit = self.standard_units.get(test_name)
            
            if not standard_unit:
                return {
                    "valid": False,
                    "reason": f"Unknown test: {test_name}",
                    "standard_unit": None
                }
            
            # Check if unit matches standard
            if normalized_unit == self._normalize_unit(standard_unit):
                return {
                    "valid": True,
                    "is_standard": True,
                    "standard_unit": standard_unit
                }
            
            # Check if unit is convertible to standard
            conversion_category = self._get_conversion_category(test_name)
            if conversion_category:
                conversions = self.conversion_factors.get(conversion_category, {})
                if normalized_unit in conversions:
                    return {
                        "valid": True,
                        "is_standard": False,
                        "convertible": True,
                        "standard_unit": standard_unit
                    }
            
            return {
                "valid": False,
                "reason": f"Unit {unit} not valid for {test_name}",
                "standard_unit": standard_unit,
                "suggestions": self._get_unit_suggestions(test_name)
            }
            
        except Exception as e:
            logger.error(f"Unit validation failed: {str(e)}")
            return {
                "valid": False,
                "reason": f"Validation error: {str(e)}",
                "standard_unit": None
            }
    
    def _get_unit_suggestions(self, test_name: str) -> List[str]:
        """Get suggested units for a test name."""
        conversion_category = self._get_conversion_category(test_name)
        if not conversion_category:
            return []
        
        conversions = self.conversion_factors.get(conversion_category, {})
        return list(conversions.keys())
    
    def convert_between_units(self, value: float, from_unit: str, 
                            to_unit: str, test_category: str) -> Optional[Dict[str, Any]]:
        """
        Convert between any two units within a test category.
        
        Args:
            value: Value to convert
            from_unit: Source unit
            to_unit: Target unit
            test_category: Category of test (glucose, cholesterol, etc.)
            
        Returns:
            Dictionary with conversion result
        """
        try:
            # Normalize units
            norm_from = self._normalize_unit(from_unit)
            norm_to = self._normalize_unit(to_unit)
            
            # Check if conversion is needed
            if norm_from == norm_to:
                return {
                    "value": value,
                    "unit": to_unit,
                    "converted": False,
                    "original_value": value,
                    "original_unit": from_unit
                }
            
            # Get conversion factors
            conversions = self.conversion_factors.get(test_category, {})
            
            if norm_from not in conversions:
                return None
            
            conversion_factor = conversions[norm_from].get(norm_to)
            if conversion_factor is None:
                return None
            
            converted_value = value * conversion_factor
            
            return {
                "value": converted_value,
                "unit": to_unit,
                "converted": True,
                "original_value": value,
                "original_unit": from_unit,
                "conversion_factor": conversion_factor
            }
            
        except Exception as e:
            logger.error(f"Unit conversion failed: {str(e)}")
            return None
    
    def get_standard_unit(self, test_name: str) -> Optional[str]:
        """Get the standard unit for a test name."""
        return self.standard_units.get(test_name)
    
    def get_supported_tests(self) -> List[str]:
        """Get list of tests with unit conversion support."""
        return list(self.standard_units.keys())
    
    def get_supported_units(self, test_category: str) -> List[str]:
        """Get list of supported units for a test category."""
        conversions = self.conversion_factors.get(test_category, {})
        return list(conversions.keys())
    
    def batch_convert(self, values: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        """
        Convert multiple lab values to their standard units.
        
        Args:
            values: List of lab value dictionaries with test_name, value, unit
            
        Returns:
            List of dictionaries with conversion results
        """
        results = []
        
        for lab_value in values:
            try:
                test_name = lab_value.get("test_name")
                value = lab_value.get("value")
                unit = lab_value.get("unit")
                
                if not all([test_name, value is not None, unit]):
                    results.append({
                        **lab_value,
                        "conversion_result": None,
                        "conversion_error": "Missing required fields"
                    })
                    continue
                
                conversion_result = self.convert_to_standard_unit(test_name, value, unit)
                
                if conversion_result:
                    results.append({
                        **lab_value,
                        "value": conversion_result["value"],
                        "unit": conversion_result["unit"],
                        "conversion_result": conversion_result
                    })
                else:
                    results.append({
                        **lab_value,
                        "conversion_result": None,
                        "conversion_error": "Conversion not available"
                    })
                    
            except Exception as e:
                logger.error(f"Batch conversion failed for item: {str(e)}")
                results.append({
                    **lab_value,
                    "conversion_result": None,
                    "conversion_error": str(e)
                })
        
        return results
    
    def get_conversion_info(self) -> Dict[str, Any]:
        """Get information about available conversions."""
        return {
            "supported_categories": list(self.conversion_factors.keys()),
            "supported_tests": list(self.standard_units.keys()),
            "total_conversion_pairs": sum(
                len(conversions) for conversions in self.conversion_factors.values()
            )
        }
