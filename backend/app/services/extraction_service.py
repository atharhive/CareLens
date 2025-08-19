"""
Document extraction service for processing medical documents.
Multi-stage extraction pipeline with confidence scoring and error handling.
"""

import logging
from pathlib import Path
from typing import Dict, List, Any, Optional
from datetime import datetime
import asyncio

from app.extract.pdf_parser import PDFParser
from app.extract.ocr_engine import OCREngine
from app.extract.lab_mapper import LabMapper
from app.extract.unit_converter import UnitConverter

logger = logging.getLogger(__name__)

class ExtractionService:
    """
    Multi-stage document extraction service for medical documents.
    
    Extraction pipeline:
    1. PDF table extraction with Camelot
    2. Text extraction with pdfplumber
    3. OCR fallback with Tesseract
    4. Lab value mapping and normalization
    5. Confidence scoring and validation
    """
    
    def __init__(self):
        """Initialize extraction components."""
        self.pdf_parser = PDFParser()
        self.ocr_engine = OCREngine()
        self.lab_mapper = LabMapper()
        self.unit_converter = UnitConverter()
        
    async def extract_document(self, file_path: Path, file_metadata: Dict[str, Any]) -> Dict[str, Any]:
        """
        Extract structured data from a medical document using multi-stage pipeline.
        
        Args:
            file_path: Path to the document file
            file_metadata: Metadata about the file
            
        Returns:
            Dictionary containing extracted lab values, confidence scores, and metadata
        """
        try:
            logger.info(f"Starting document extraction for: {file_path.name}")
            
            extraction_results = {
                "timestamp": datetime.utcnow().isoformat(),
                "file_path": str(file_path),
                "file_type": file_metadata.get("file_type", ""),
                "extraction_stages": [],
                "lab_values": [],
                "confidence": 0.0,
                "method": "unknown",
                "requires_manual_review": False,
                "errors": []
            }
            
            # Determine file type and choose extraction strategy
            file_type = file_metadata.get("file_type", "").lower()
            
            if "pdf" in file_type:
                extraction_results = await self._extract_pdf(file_path, extraction_results)
            elif any(img_type in file_type for img_type in ["jpeg", "jpg", "png"]):
                extraction_results = await self._extract_image(file_path, extraction_results)
            else:
                raise ValueError(f"Unsupported file type: {file_type}")
            
            # Process and normalize extracted lab values
            if extraction_results["lab_values"]:
                extraction_results["lab_values"] = await self._process_lab_values(
                    extraction_results["lab_values"]
                )
            
            # Calculate overall confidence and determine if manual review is needed
            extraction_results["confidence"] = self._calculate_overall_confidence(
                extraction_results["lab_values"]
            )
            extraction_results["requires_manual_review"] = (
                extraction_results["confidence"] < 0.7 or 
                len(extraction_results["errors"]) > 0
            )
            
            logger.info(
                f"Extraction completed: {len(extraction_results['lab_values'])} values, "
                f"confidence: {extraction_results['confidence']:.2f}"
            )
            
            return extraction_results
            
        except Exception as e:
            logger.error(f"Document extraction failed: {str(e)}", exc_info=True)
            return {
                "timestamp": datetime.utcnow().isoformat(),
                "file_path": str(file_path),
                "lab_values": [],
                "confidence": 0.0,
                "method": "failed",
                "requires_manual_review": True,
                "errors": [str(e)]
            }
    
    async def _extract_pdf(self, file_path: Path, results: Dict[str, Any]) -> Dict[str, Any]:
        """Extract data from PDF using multi-stage approach."""
        try:
            # Stage 1: Table extraction with Camelot
            logger.info("Starting PDF table extraction with Camelot")
            table_data = await self.pdf_parser.extract_tables(file_path)
            
            if table_data["tables"]:
                results["extraction_stages"].append("camelot_tables")
                results["method"] = "camelot"
                lab_values = self.lab_mapper.extract_from_tables(table_data["tables"])
                results["lab_values"].extend(lab_values)
                logger.info(f"Camelot extracted {len(lab_values)} lab values from tables")
            
            # Stage 2: Text extraction with pdfplumber
            logger.info("Starting PDF text extraction with pdfplumber")
            text_data = await self.pdf_parser.extract_text(file_path)
            
            if text_data["text"]:
                results["extraction_stages"].append("pdfplumber_text")
                if not results["lab_values"]:  # Only use if tables didn't work
                    results["method"] = "pdfplumber"
                
                text_lab_values = self.lab_mapper.extract_from_text(text_data["text"])
                # Merge with existing values, avoiding duplicates
                results["lab_values"] = self._merge_lab_values(
                    results["lab_values"], text_lab_values
                )
                logger.info(f"pdfplumber extracted additional text-based lab values")
            
            # Stage 3: OCR fallback if needed
            if not results["lab_values"] or results["confidence"] < 0.5:
                logger.info("Starting OCR fallback extraction")
                ocr_results = await self._extract_with_ocr(file_path, results)
                if ocr_results["lab_values"]:
                    results["extraction_stages"].append("ocr_fallback")
                    if not results["lab_values"]:
                        results["method"] = "ocr"
                    results["lab_values"] = self._merge_lab_values(
                        results["lab_values"], ocr_results["lab_values"]
                    )
            
            return results
            
        except Exception as e:
            logger.error(f"PDF extraction failed: {str(e)}")
            results["errors"].append(f"PDF extraction error: {str(e)}")
            return results
    
    async def _extract_image(self, file_path: Path, results: Dict[str, Any]) -> Dict[str, Any]:
        """Extract data from image files using OCR."""
        try:
            logger.info("Starting image extraction with OCR")
            results["extraction_stages"].append("image_ocr")
            results["method"] = "ocr"
            
            # Use OCR for image files
            ocr_results = await self._extract_with_ocr(file_path, results)
            results["lab_values"] = ocr_results["lab_values"]
            
            return results
            
        except Exception as e:
            logger.error(f"Image extraction failed: {str(e)}")
            results["errors"].append(f"Image extraction error: {str(e)}")
            return results
    
    async def _extract_with_ocr(self, file_path: Path, results: Dict[str, Any]) -> Dict[str, Any]:
        """Extract text using OCR and parse for lab values."""
        try:
            # Perform OCR
            ocr_result = await self.ocr_engine.extract_text(file_path)
            
            if ocr_result["text"]:
                # Extract lab values from OCR text
                lab_values = self.lab_mapper.extract_from_text(
                    ocr_result["text"],
                    confidence_modifier=0.8  # OCR typically less reliable
                )
                
                return {
                    "lab_values": lab_values,
                    "ocr_confidence": ocr_result["confidence"]
                }
            else:
                results["errors"].append("OCR failed to extract readable text")
                return {"lab_values": []}
                
        except Exception as e:
            logger.error(f"OCR extraction failed: {str(e)}")
            results["errors"].append(f"OCR error: {str(e)}")
            return {"lab_values": []}
    
    async def _process_lab_values(self, lab_values: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        """Process and normalize extracted lab values."""
        processed_values = []
        
        for lab_value in lab_values:
            try:
                # Normalize units
                normalized_value = self.unit_converter.convert_to_standard_unit(
                    lab_value["test_name"],
                    lab_value["value"],
                    lab_value["unit"]
                )
                
                # Update lab value with normalized data
                if normalized_value:
                    lab_value.update(normalized_value)
                
                # Validate against reference ranges
                lab_value["is_abnormal"] = self.lab_mapper.is_value_abnormal(
                    lab_value["test_name"],
                    lab_value["value"],
                    lab_value["unit"]
                )
                
                # Set reference range if not present
                if not lab_value.get("reference_range"):
                    lab_value["reference_range"] = self.lab_mapper.get_reference_range(
                        lab_value["test_name"]
                    )
                
                processed_values.append(lab_value)
                
            except Exception as e:
                logger.warning(f"Failed to process lab value {lab_value}: {str(e)}")
                # Keep original value but mark as needing review
                lab_value["processing_error"] = str(e)
                lab_value["confidence"] = min(lab_value.get("confidence", 0.5), 0.5)
                processed_values.append(lab_value)
        
        return processed_values
    
    def _merge_lab_values(self, existing_values: List[Dict[str, Any]], 
                         new_values: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        """Merge lab values, avoiding duplicates and preferring higher confidence."""
        merged_values = existing_values.copy()
        
        for new_value in new_values:
            # Check if this test already exists
            existing_index = None
            for i, existing_value in enumerate(merged_values):
                if (existing_value["test_name"].lower() == new_value["test_name"].lower()):
                    existing_index = i
                    break
            
            if existing_index is not None:
                # Replace if new value has higher confidence
                if new_value.get("confidence", 0) > merged_values[existing_index].get("confidence", 0):
                    merged_values[existing_index] = new_value
            else:
                # Add new value
                merged_values.append(new_value)
        
        return merged_values
    
    def _calculate_overall_confidence(self, lab_values: List[Dict[str, Any]]) -> float:
        """Calculate overall confidence score for extracted lab values."""
        if not lab_values:
            return 0.0
        
        total_confidence = sum(
            lab_value.get("confidence", 0.5) for lab_value in lab_values
        )
        
        average_confidence = total_confidence / len(lab_values)
        
        # Boost confidence if we have multiple values
        if len(lab_values) >= 3:
            average_confidence = min(average_confidence * 1.1, 1.0)
        
        return round(average_confidence, 3)
    
    async def extract_batch(self, file_paths: List[Path], 
                          file_metadata_list: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        """Extract data from multiple documents in parallel."""
        try:
            logger.info(f"Starting batch extraction for {len(file_paths)} files")
            
            # Create extraction tasks
            tasks = []
            for file_path, metadata in zip(file_paths, file_metadata_list):
                task = self.extract_document(file_path, metadata)
                tasks.append(task)
            
            # Execute extractions in parallel (limit concurrency)
            batch_size = 3  # Limit concurrent extractions
            results = []
            
            for i in range(0, len(tasks), batch_size):
                batch_tasks = tasks[i:i + batch_size]
                batch_results = await asyncio.gather(*batch_tasks, return_exceptions=True)
                results.extend(batch_results)
            
            # Handle any exceptions in results
            processed_results = []
            for i, result in enumerate(results):
                if isinstance(result, Exception):
                    logger.error(f"Batch extraction failed for file {i}: {str(result)}")
                    processed_results.append({
                        "file_path": str(file_paths[i]) if i < len(file_paths) else "unknown",
                        "lab_values": [],
                        "confidence": 0.0,
                        "method": "failed",
                        "requires_manual_review": True,
                        "errors": [str(result)]
                    })
                else:
                    processed_results.append(result)
            
            logger.info(f"Batch extraction completed: {len(processed_results)} files processed")
            return processed_results
            
        except Exception as e:
            logger.error(f"Batch extraction failed: {str(e)}", exc_info=True)
            raise
    
    def get_supported_file_types(self) -> List[str]:
        """Get list of supported file types for extraction."""
        return ["pdf", "jpg", "jpeg", "png"]
    
    def get_extraction_statistics(self, results: List[Dict[str, Any]]) -> Dict[str, Any]:
        """Generate statistics about extraction results."""
        if not results:
            return {"total_files": 0, "successful_extractions": 0}
        
        successful = sum(1 for r in results if r.get("lab_values"))
        high_confidence = sum(1 for r in results if r.get("confidence", 0) >= 0.8)
        needs_review = sum(1 for r in results if r.get("requires_manual_review", False))
        
        total_lab_values = sum(len(r.get("lab_values", [])) for r in results)
        
        return {
            "total_files": len(results),
            "successful_extractions": successful,
            "high_confidence_extractions": high_confidence,
            "needs_manual_review": needs_review,
            "total_lab_values_extracted": total_lab_values,
            "average_confidence": sum(r.get("confidence", 0) for r in results) / len(results),
            "extraction_methods": list(set(r.get("method", "unknown") for r in results))
        }

async def get_extraction_service() -> ExtractionService:
    """Get the extraction service instance."""
    return ExtractionService()