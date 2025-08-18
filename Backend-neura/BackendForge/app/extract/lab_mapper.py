"""
Lab value mapping and extraction from medical documents.
Identifies, extracts, and normalizes laboratory test results.
"""

import logging
import re
from typing import Dict, List, Any, Optional, Tuple
from datetime import datetime
import json

logger = logging.getLogger(__name__)

class LabMapper:
    """
    Laboratory value mapper for extracting and normalizing lab results.
    
    Features:
    - Pattern-based lab value extraction
    - Reference range validation
    - Confidence scoring
    - Unit-aware parsing
    """
    
    def __init__(self):
        """Initialize lab mapper with test patterns and reference ranges."""
        self.lab_patterns = self._load_lab_patterns()
        self.reference_ranges = self._load_reference_ranges()
        self.unit_patterns = self._load_unit_patterns()
        
    def _load_lab_patterns(self) -> Dict[str, List[str]]:
        """Load regex patterns for different lab tests."""
        return {
            "glucose_fasting": [
                r"fasting\s+glucose[:\s]*(\d+(?:\.\d+)?)",
                r"glucose[,\s]*fasting[:\s]*(\d+(?:\.\d+)?)",
                r"FBG[:\s]*(\d+(?:\.\d+)?)",
                r"fasting\s+blood\s+glucose[:\s]*(\d+(?:\.\d+)?)"
            ],
            "glucose_random": [
                r"random\s+glucose[:\s]*(\d+(?:\.\d+)?)",
                r"glucose[,\s]*random[:\s]*(\d+(?:\.\d+)?)",
                r"RBG[:\s]*(\d+(?:\.\d+)?)"
            ],
            "hba1c": [
                r"hba1c[:\s]*(\d+(?:\.\d+)?)",
                r"hemoglobin\s+a1c[:\s]*(\d+(?:\.\d+)?)",
                r"glycated\s+hemoglobin[:\s]*(\d+(?:\.\d+)?)",
                r"a1c[:\s]*(\d+(?:\.\d+)?)"
            ],
            "cholesterol_total": [
                r"total\s+cholesterol[:\s]*(\d+(?:\.\d+)?)",
                r"cholesterol[,\s]*total[:\s]*(\d+(?:\.\d+)?)",
                r"TC[:\s]*(\d+(?:\.\d+)?)",
                r"serum\s+cholesterol[:\s]*(\d+(?:\.\d+)?)"
            ],
            "cholesterol_hdl": [
                r"hdl[:\s]*(\d+(?:\.\d+)?)",
                r"hdl\s+cholesterol[:\s]*(\d+(?:\.\d+)?)",
                r"high\s+density\s+lipoprotein[:\s]*(\d+(?:\.\d+)?)"
            ],
            "cholesterol_ldl": [
                r"ldl[:\s]*(\d+(?:\.\d+)?)",
                r"ldl\s+cholesterol[:\s]*(\d+(?:\.\d+)?)",
                r"low\s+density\s+lipoprotein[:\s]*(\d+(?:\.\d+)?)"
            ],
            "triglycerides": [
                r"triglycerides[:\s]*(\d+(?:\.\d+)?)",
                r"tg[:\s]*(\d+(?:\.\d+)?)",
                r"trigs[:\s]*(\d+(?:\.\d+)?)"
            ],
            "creatinine": [
                r"creatinine[:\s]*(\d+(?:\.\d+)?)",
                r"serum\s+creatinine[:\s]*(\d+(?:\.\d+)?)",
                r"cr[:\s]*(\d+(?:\.\d+)?)"
            ],
            "bun": [
                r"bun[:\s]*(\d+(?:\.\d+)?)",
                r"blood\s+urea\s+nitrogen[:\s]*(\d+(?:\.\d+)?)",
                r"urea[:\s]*(\d+(?:\.\d+)?)"
            ],
            "hemoglobin": [
                r"hemoglobin[:\s]*(\d+(?:\.\d+)?)",
                r"hgb[:\s]*(\d+(?:\.\d+)?)",
                r"hb[:\s]*(\d+(?:\.\d+)?)"
            ],
            "hematocrit": [
                r"hematocrit[:\s]*(\d+(?:\.\d+)?)",
                r"hct[:\s]*(\d+(?:\.\d+)?)",
                r"packed\s+cell\s+volume[:\s]*(\d+(?:\.\d+)?)"
            ],
            "white_blood_cells": [
                r"wbc[:\s]*(\d+(?:\.\d+)?)",
                r"white\s+blood\s+cells[:\s]*(\d+(?:\.\d+)?)",
                r"leukocytes[:\s]*(\d+(?:\.\d+)?)"
            ],
            "platelets": [
                r"platelets[:\s]*(\d+(?:\.\d+)?)",
                r"plt[:\s]*(\d+(?:\.\d+)?)",
                r"thrombocytes[:\s]*(\d+(?:\.\d+)?)"
            ],
            "tsh": [
                r"tsh[:\s]*(\d+(?:\.\d+)?)",
                r"thyroid\s+stimulating\s+hormone[:\s]*(\d+(?:\.\d+)?)",
                r"thyrotropin[:\s]*(\d+(?:\.\d+)?)"
            ],
            "t3": [
                r"t3[:\s]*(\d+(?:\.\d+)?)",
                r"triiodothyronine[:\s]*(\d+(?:\.\d+)?)",
                r"free\s+t3[:\s]*(\d+(?:\.\d+)?)"
            ],
            "t4": [
                r"t4[:\s]*(\d+(?:\.\d+)?)",
                r"thyroxine[:\s]*(\d+(?:\.\d+)?)",
                r"free\s+t4[:\s]*(\d+(?:\.\d+)?)"
            ],
            "alt": [
                r"alt[:\s]*(\d+(?:\.\d+)?)",
                r"alanine\s+aminotransferase[:\s]*(\d+(?:\.\d+)?)",
                r"alat[:\s]*(\d+(?:\.\d+)?)"
            ],
            "ast": [
                r"ast[:\s]*(\d+(?:\.\d+)?)",
                r"aspartate\s+aminotransferase[:\s]*(\d+(?:\.\d+)?)",
                r"asat[:\s]*(\d+(?:\.\d+)?)"
            ],
            "bilirubin_total": [
                r"total\s+bilirubin[:\s]*(\d+(?:\.\d+)?)",
                r"bilirubin[,\s]*total[:\s]*(\d+(?:\.\d+)?)",
                r"tbil[:\s]*(\d+(?:\.\d+)?)"
            ],
            "albumin": [
                r"albumin[:\s]*(\d+(?:\.\d+)?)",
                r"serum\s+albumin[:\s]*(\d+(?:\.\d+)?)",
                r"alb[:\s]*(\d+(?:\.\d+)?)"
            ]
        }
    
    def _load_reference_ranges(self) -> Dict[str, Dict[str, Any]]:
        """Load normal reference ranges for lab tests."""
        return {
            "glucose_fasting": {"min": 70, "max": 100, "unit": "mg/dL", "critical_high": 126},
            "glucose_random": {"min": 70, "max": 140, "unit": "mg/dL", "critical_high": 200},
            "hba1c": {"min": 4.0, "max": 5.6, "unit": "%", "critical_high": 7.0},
            "cholesterol_total": {"min": 0, "max": 200, "unit": "mg/dL", "critical_high": 240},
            "cholesterol_hdl": {"min": 40, "max": 100, "unit": "mg/dL", "critical_low": 40},
            "cholesterol_ldl": {"min": 0, "max": 130, "unit": "mg/dL", "critical_high": 160},
            "triglycerides": {"min": 0, "max": 150, "unit": "mg/dL", "critical_high": 200},
            "creatinine": {"min": 0.6, "max": 1.2, "unit": "mg/dL", "critical_high": 2.0},
            "bun": {"min": 7, "max": 20, "unit": "mg/dL", "critical_high": 50},
            "hemoglobin": {"min": 12.0, "max": 16.0, "unit": "g/dL", "critical_low": 8.0},
            "hematocrit": {"min": 36, "max": 48, "unit": "%", "critical_low": 24},
            "white_blood_cells": {"min": 4.0, "max": 11.0, "unit": "K/μL", "critical_high": 20.0},
            "platelets": {"min": 150, "max": 450, "unit": "K/μL", "critical_low": 50},
            "tsh": {"min": 0.4, "max": 4.0, "unit": "mIU/L", "critical_high": 10.0},
            "t3": {"min": 80, "max": 200, "unit": "ng/dL", "critical_high": 300},
            "t4": {"min": 5.0, "max": 12.0, "unit": "μg/dL", "critical_high": 20.0},
            "alt": {"min": 7, "max": 40, "unit": "U/L", "critical_high": 120},
            "ast": {"min": 8, "max": 40, "unit": "U/L", "critical_high": 120},
            "bilirubin_total": {"min": 0.2, "max": 1.2, "unit": "mg/dL", "critical_high": 3.0},
            "albumin": {"min": 3.5, "max": 5.0, "unit": "g/dL", "critical_low": 2.5}
        }
    
    def _load_unit_patterns(self) -> Dict[str, List[str]]:
        """Load patterns for detecting units of measurement."""
        return {
            "mg/dL": [r"mg/dl", r"mg\s*/\s*dl", r"milligrams per deciliter"],
            "g/dL": [r"g/dl", r"g\s*/\s*dl", r"grams per deciliter"],
            "μg/dL": [r"μg/dl", r"ug/dl", r"mcg/dl", r"micrograms per deciliter"],
            "ng/dL": [r"ng/dl", r"nanograms per deciliter"],
            "mIU/L": [r"miu/l", r"milli international units per liter"],
            "U/L": [r"u/l", r"units per liter", r"iu/l"],
            "K/μL": [r"k/μl", r"k/ul", r"thousands per microliter"],
            "%": [r"percent", r"percentage"],
            "mmol/L": [r"mmol/l", r"millimoles per liter"],
            "cells/μL": [r"cells/μl", r"cells/ul", r"cells per microliter"]
        }
    
    def extract_from_text(self, text: str, confidence_modifier: float = 1.0) -> List[Dict[str, Any]]:
        """
        Extract lab values from text using pattern matching.
        
        Args:
            text: Text to extract lab values from
            confidence_modifier: Modifier for confidence scores (0.0-1.0)
            
        Returns:
            List of extracted lab values with metadata
        """
        try:
            logger.info("Extracting lab values from text")
            
            # Normalize text
            normalized_text = self._normalize_text(text)
            
            extracted_values = []
            
            # Apply patterns for each lab test
            for test_name, patterns in self.lab_patterns.items():
                for pattern in patterns:
                    try:
                        matches = re.finditer(pattern, normalized_text, re.IGNORECASE)
                        
                        for match in matches:
                            value_str = match.group(1)
                            
                            # Try to convert to float
                            try:
                                value = float(value_str)
                            except ValueError:
                                continue
                            
                            # Extract context around the match for unit detection
                            start_pos = max(0, match.start() - 50)
                            end_pos = min(len(normalized_text), match.end() + 50)
                            context = normalized_text[start_pos:end_pos]
                            
                            # Detect unit
                            detected_unit = self._detect_unit(context, test_name)
                            
                            # Calculate confidence based on pattern specificity and context
                            confidence = self._calculate_extraction_confidence(
                                match, context, test_name, pattern
                            ) * confidence_modifier
                            
                            # Get reference range
                            reference_range = self.get_reference_range(test_name)
                            
                            # Check if value is abnormal
                            is_abnormal = self.is_value_abnormal(test_name, value, detected_unit)
                            
                            lab_value = {
                                "test_name": test_name,
                                "value": value,
                                "unit": detected_unit,
                                "reference_range": reference_range,
                                "confidence": confidence,
                                "is_abnormal": is_abnormal,
                                "pattern_used": pattern,
                                "context": context,
                                "position": match.start()
                            }
                            
                            extracted_values.append(lab_value)
                            
                    except Exception as e:
                        logger.warning(f"Pattern matching failed for {test_name}: {str(e)}")
                        continue
            
            # Remove duplicates and keep highest confidence values
            unique_values = self._deduplicate_values(extracted_values)
            
            logger.info(f"Extracted {len(unique_values)} unique lab values")
            return unique_values
            
        except Exception as e:
            logger.error(f"Lab value extraction failed: {str(e)}", exc_info=True)
            return []
    
    def extract_from_tables(self, tables: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        """
        Extract lab values from structured table data.
        
        Args:
            tables: List of table dictionaries from PDF extraction
            
        Returns:
            List of extracted lab values
        """
        try:
            logger.info(f"Extracting lab values from {len(tables)} tables")
            
            extracted_values = []
            
            for table_idx, table in enumerate(tables):
                try:
                    table_data = table.get("data", [])
                    headers = table.get("headers", [])
                    
                    # Find columns that might contain test names and values
                    test_col, value_col, unit_col = self._identify_table_columns(headers, table_data)
                    
                    if test_col is None or value_col is None:
                        logger.warning(f"Could not identify test/value columns in table {table_idx}")
                        continue
                    
                    # Extract values from each row
                    for row_idx, row in enumerate(table_data):
                        if len(row) <= max(test_col, value_col):
                            continue
                        
                        test_name_raw = str(row[test_col]).strip()
                        value_raw = str(row[value_col]).strip()
                        
                        # Skip header rows or empty cells
                        if not test_name_raw or not value_raw or test_name_raw.lower() in ['test', 'parameter', 'name']:
                            continue
                        
                        # Normalize test name
                        normalized_test_name = self._normalize_test_name(test_name_raw)
                        
                        if not normalized_test_name:
                            continue
                        
                        # Extract numeric value
                        numeric_value = self._extract_numeric_value(value_raw)
                        
                        if numeric_value is None:
                            continue
                        
                        # Get unit
                        unit = ""
                        if unit_col is not None and len(row) > unit_col:
                            unit = str(row[unit_col]).strip()
                        
                        if not unit:
                            unit = self._extract_unit_from_value(value_raw)
                        
                        if not unit:
                            unit = self._get_default_unit(normalized_test_name)
                        
                        # Calculate confidence (tables generally more reliable)
                        confidence = min(0.9, table.get("accuracy", 0.8))
                        
                        # Get reference range
                        reference_range = self.get_reference_range(normalized_test_name)
                        
                        # Check if abnormal
                        is_abnormal = self.is_value_abnormal(normalized_test_name, numeric_value, unit)
                        
                        lab_value = {
                            "test_name": normalized_test_name,
                            "value": numeric_value,
                            "unit": unit,
                            "reference_range": reference_range,
                            "confidence": confidence,
                            "is_abnormal": is_abnormal,
                            "source": f"table_{table_idx}_row_{row_idx}",
                            "original_test_name": test_name_raw,
                            "original_value": value_raw
                        }
                        
                        extracted_values.append(lab_value)
                        
                except Exception as e:
                    logger.warning(f"Failed to process table {table_idx}: {str(e)}")
                    continue
            
            # Remove duplicates
            unique_values = self._deduplicate_values(extracted_values)
            
            logger.info(f"Extracted {len(unique_values)} unique lab values from tables")
            return unique_values
            
        except Exception as e:
            logger.error(f"Table lab value extraction failed: {str(e)}")
            return []
    
    def _normalize_text(self, text: str) -> str:
        """Normalize text for better pattern matching."""
        # Remove extra whitespace
        normalized = re.sub(r'\s+', ' ', text)
        
        # Normalize common medical abbreviations
        replacements = {
            r'\bFBS\b': 'fasting glucose',
            r'\bRBS\b': 'random glucose',
            r'\bTC\b': 'total cholesterol',
            r'\bHDL-C\b': 'HDL cholesterol',
            r'\bLDL-C\b': 'LDL cholesterol',
            r'\bSCr\b': 'serum creatinine',
            r'\bTBIL\b': 'total bilirubin'
        }
        
        for pattern, replacement in replacements.items():
            normalized = re.sub(pattern, replacement, normalized, flags=re.IGNORECASE)
        
        return normalized
    
    def _detect_unit(self, context: str, test_name: str) -> str:
        """Detect unit of measurement from context."""
        # Look for explicit units in context
        for unit, patterns in self.unit_patterns.items():
            for pattern in patterns:
                if re.search(pattern, context, re.IGNORECASE):
                    return unit
        
        # Fall back to default unit for test type
        return self._get_default_unit(test_name)
    
    def _get_default_unit(self, test_name: str) -> str:
        """Get default unit for a test type."""
        reference = self.reference_ranges.get(test_name, {})
        return reference.get("unit", "")
    
    def _calculate_extraction_confidence(self, match: re.Match, context: str, 
                                       test_name: str, pattern: str) -> float:
        """Calculate confidence score for extracted value."""
        confidence = 0.5  # Base confidence
        
        # Boost confidence for specific patterns
        if "fasting" in pattern.lower():
            confidence += 0.2
        if test_name in pattern.lower():
            confidence += 0.2
        
        # Boost confidence if units are present
        if any(unit_pattern in context.lower() for unit_patterns in self.unit_patterns.values() 
               for unit_pattern in unit_patterns):
            confidence += 0.1
        
        # Boost confidence if reference range indicators present
        if any(indicator in context.lower() for indicator in ['normal', 'abnormal', 'high', 'low', 'range']):
            confidence += 0.1
        
        # Reduce confidence if value seems unrealistic
        try:
            value = float(match.group(1))
            reference = self.reference_ranges.get(test_name, {})
            if reference:
                # Check if value is extremely outside normal range
                min_val = reference.get("min", 0)
                max_val = reference.get("max", 1000)
                if value < min_val * 0.1 or value > max_val * 10:
                    confidence -= 0.3
        except (ValueError, IndexError):
            confidence -= 0.2
        
        return max(0.1, min(1.0, confidence))
    
    def _identify_table_columns(self, headers: List[str], 
                               data: List[List[str]]) -> Tuple[Optional[int], Optional[int], Optional[int]]:
        """Identify which columns contain test names, values, and units."""
        test_col = None
        value_col = None
        unit_col = None
        
        # Look for test name column
        test_indicators = ['test', 'parameter', 'name', 'analyte', 'component']
        for i, header in enumerate(headers):
            if any(indicator in header.lower() for indicator in test_indicators):
                test_col = i
                break
        
        # Look for value column
        value_indicators = ['value', 'result', 'level', 'concentration', 'amount']
        for i, header in enumerate(headers):
            if any(indicator in header.lower() for indicator in value_indicators):
                value_col = i
                break
        
        # Look for unit column
        unit_indicators = ['unit', 'units', 'measurement', 'uom']
        for i, header in enumerate(headers):
            if any(indicator in header.lower() for indicator in unit_indicators):
                unit_col = i
                break
        
        # If headers don't help, analyze data patterns
        if test_col is None or value_col is None:
            test_col, value_col, unit_col = self._analyze_data_patterns(data)
        
        return test_col, value_col, unit_col
    
    def _analyze_data_patterns(self, data: List[List[str]]) -> Tuple[Optional[int], Optional[int], Optional[int]]:
        """Analyze data patterns to identify columns."""
        if not data or len(data) < 2:
            return None, None, None
        
        num_cols = len(data[0]) if data[0] else 0
        test_col = None
        value_col = None
        unit_col = None
        
        # Analyze each column
        for col_idx in range(num_cols):
            col_data = [row[col_idx] if col_idx < len(row) else "" for row in data]
            
            # Count numeric vs text patterns
            numeric_count = 0
            text_count = 0
            test_name_count = 0
            unit_count = 0
            
            for cell in col_data:
                cell = cell.strip()
                if not cell:
                    continue
                
                # Check if numeric
                if re.match(r'^\d+(?:\.\d+)?$', cell):
                    numeric_count += 1
                elif any(test_name in cell.lower() for test_name in self.lab_patterns.keys()):
                    test_name_count += 1
                elif any(unit in cell.lower() for unit_patterns in self.unit_patterns.values() 
                        for unit in unit_patterns):
                    unit_count += 1
                else:
                    text_count += 1
            
            # Determine column type based on patterns
            total_cells = len([cell for cell in col_data if cell.strip()])
            if total_cells == 0:
                continue
            
            if numeric_count / total_cells > 0.7:
                value_col = col_idx
            elif test_name_count / total_cells > 0.3:
                test_col = col_idx
            elif unit_count / total_cells > 0.5:
                unit_col = col_idx
        
        return test_col, value_col, unit_col
    
    def _normalize_test_name(self, test_name: str) -> Optional[str]:
        """Normalize test name to standard format."""
        test_name = test_name.lower().strip()
        
        # Direct mappings
        name_mappings = {
            "fbs": "glucose_fasting",
            "fasting blood sugar": "glucose_fasting",
            "fasting glucose": "glucose_fasting",
            "rbs": "glucose_random",
            "random blood sugar": "glucose_random",
            "hemoglobin a1c": "hba1c",
            "glycated hemoglobin": "hba1c",
            "total cholesterol": "cholesterol_total",
            "hdl cholesterol": "cholesterol_hdl",
            "ldl cholesterol": "cholesterol_ldl",
            "serum creatinine": "creatinine",
            "blood urea nitrogen": "bun",
            "hemoglobin": "hemoglobin",
            "hematocrit": "hematocrit",
            "white blood cells": "white_blood_cells",
            "platelets": "platelets",
            "thyroid stimulating hormone": "tsh",
            "triiodothyronine": "t3",
            "thyroxine": "t4",
            "alanine aminotransferase": "alt",
            "aspartate aminotransferase": "ast",
            "total bilirubin": "bilirubin_total",
            "albumin": "albumin"
        }
        
        # Check direct mappings first
        if test_name in name_mappings:
            return name_mappings[test_name]
        
        # Check if test name contains any known test
        for standard_name, patterns in self.lab_patterns.items():
            if any(standard_name.replace("_", " ") in test_name or 
                   standard_name.replace("_", "") in test_name.replace(" ", "")):
                return standard_name
        
        return None
    
    def _extract_numeric_value(self, value_str: str) -> Optional[float]:
        """Extract numeric value from string."""
        # Remove common non-numeric characters but keep decimal points
        cleaned = re.sub(r'[^\d.]', '', value_str)
        
        # Extract first numeric value
        match = re.search(r'\d+(?:\.\d+)?', cleaned)
        if match:
            try:
                return float(match.group())
            except ValueError:
                pass
        
        return None
    
    def _extract_unit_from_value(self, value_str: str) -> str:
        """Extract unit from value string."""
        for unit, patterns in self.unit_patterns.items():
            for pattern in patterns:
                if re.search(pattern, value_str, re.IGNORECASE):
                    return unit
        return ""
    
    def _deduplicate_values(self, values: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        """Remove duplicate lab values, keeping highest confidence."""
        unique_values = {}
        
        for value in values:
            test_name = value["test_name"]
            confidence = value.get("confidence", 0)
            
            if test_name not in unique_values or confidence > unique_values[test_name].get("confidence", 0):
                unique_values[test_name] = value
        
        return list(unique_values.values())
    
    def get_reference_range(self, test_name: str) -> str:
        """Get reference range string for a test."""
        reference = self.reference_ranges.get(test_name, {})
        if not reference:
            return ""
        
        min_val = reference.get("min")
        max_val = reference.get("max")
        unit = reference.get("unit", "")
        
        if min_val is not None and max_val is not None:
            return f"{min_val}-{max_val} {unit}".strip()
        elif max_val is not None:
            return f"<{max_val} {unit}".strip()
        elif min_val is not None:
            return f">{min_val} {unit}".strip()
        
        return ""
    
    def is_value_abnormal(self, test_name: str, value: float, unit: str) -> Optional[bool]:
        """Check if a lab value is abnormal."""
        reference = self.reference_ranges.get(test_name, {})
        if not reference:
            return None
        
        min_val = reference.get("min")
        max_val = reference.get("max")
        
        if min_val is not None and value < min_val:
            return True
        if max_val is not None and value > max_val:
            return True
        
        return False
    
    def get_supported_tests(self) -> List[str]:
        """Get list of supported lab tests."""
        return list(self.lab_patterns.keys())
    
    def validate_extraction_results(self, results: List[Dict[str, Any]]) -> Dict[str, Any]:
        """Validate and provide quality metrics for extraction results."""
        if not results:
            return {
                "total_values": 0,
                "high_confidence_count": 0,
                "abnormal_count": 0,
                "validation_warnings": ["No lab values extracted"]
            }
        
        high_confidence_count = sum(1 for r in results if r.get("confidence", 0) >= 0.8)
        abnormal_count = sum(1 for r in results if r.get("is_abnormal"))
        low_confidence_count = sum(1 for r in results if r.get("confidence", 0) < 0.5)
        
        warnings = []
        if low_confidence_count > 0:
            warnings.append(f"{low_confidence_count} values have low confidence (<0.5)")
        
        # Check for unrealistic values
        for result in results:
            test_name = result["test_name"]
            value = result["value"]
            reference = self.reference_ranges.get(test_name, {})
            
            if reference:
                min_realistic = reference.get("min", 0) * 0.1
                max_realistic = reference.get("max", 1000) * 5
                
                if value < min_realistic or value > max_realistic:
                    warnings.append(f"Potentially unrealistic value for {test_name}: {value}")
        
        return {
            "total_values": len(results),
            "high_confidence_count": high_confidence_count,
            "low_confidence_count": low_confidence_count,
            "abnormal_count": abnormal_count,
            "validation_warnings": warnings,
            "extraction_quality": "good" if high_confidence_count / len(results) > 0.7 else "needs_review"
        }
