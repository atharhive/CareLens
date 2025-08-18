"""
OCR engine for text extraction from images and image-based PDFs.
Implements Tesseract OCR with preprocessing and confidence scoring.
"""

import logging
from pathlib import Path
from typing import Dict, List, Any, Optional, Tuple
import tempfile
import asyncio

# Image processing imports
try:
    from PIL import Image, ImageEnhance, ImageFilter
    PIL_AVAILABLE = True
except ImportError:
    PIL_AVAILABLE = False

try:
    import cv2
    import numpy as np
    CV2_AVAILABLE = True
except ImportError:
    CV2_AVAILABLE = False

try:
    import pytesseract
    TESSERACT_AVAILABLE = True
except ImportError:
    TESSERACT_AVAILABLE = False

from app.core.config import settings

logger = logging.getLogger(__name__)

class OCREngine:
    """
    OCR engine for extracting text from images and scanned documents.
    
    Features:
    - Image preprocessing for better OCR accuracy
    - Multiple OCR confidence scoring
    - Language support
    - Batch processing
    """
    
    def __init__(self):
        """Initialize OCR engine."""
        self.supported_formats = ['.png', '.jpg', '.jpeg', '.tiff', '.bmp']
        self.languages = getattr(settings, 'OCR_LANGUAGES', ['eng'])
        
        # Set Tesseract command path if specified
        tesseract_cmd = getattr(settings, 'TESSERACT_CMD', None)
        if tesseract_cmd and TESSERACT_AVAILABLE:
            pytesseract.pytesseract.tesseract_cmd = tesseract_cmd
    
    async def extract_text(self, image_path: Path, 
                         preprocess: bool = True,
                         confidence_threshold: float = 0.5) -> Dict[str, Any]:
        """
        Extract text from image using OCR.
        
        Args:
            image_path: Path to image file
            preprocess: Whether to preprocess image for better OCR
            confidence_threshold: Minimum confidence threshold
            
        Returns:
            Dictionary containing extracted text and metadata
        """
        try:
            logger.info(f"Performing OCR on image: {image_path.name}")
            
            if not TESSERACT_AVAILABLE:
                raise RuntimeError("Tesseract OCR not available")
            
            if not PIL_AVAILABLE:
                raise RuntimeError("PIL not available for image processing")
            
            if not image_path.exists():
                raise FileNotFoundError(f"Image file not found: {image_path}")
            
            # Load and preprocess image
            if preprocess:
                processed_image = await self._preprocess_image(image_path)
            else:
                processed_image = Image.open(image_path)
            
            # Configure Tesseract
            custom_config = self._get_tesseract_config()
            
            # Extract text with detailed data
            ocr_data = pytesseract.image_to_data(
                processed_image,
                lang='+'.join(self.languages),
                config=custom_config,
                output_type=pytesseract.Output.DICT
            )
            
            # Extract plain text
            extracted_text = pytesseract.image_to_string(
                processed_image,
                lang='+'.join(self.languages),
                config=custom_config
            )
            
            # Calculate confidence scores
            confidence_data = self._calculate_confidence(ocr_data, confidence_threshold)
            
            # Process text blocks
            text_blocks = self._process_text_blocks(ocr_data, confidence_threshold)
            
            result = {
                "text": extracted_text.strip(),
                "confidence": confidence_data["average_confidence"],
                "high_confidence_text": confidence_data["high_confidence_text"],
                "low_confidence_regions": confidence_data["low_confidence_regions"],
                "text_blocks": text_blocks,
                "word_count": len(extracted_text.split()),
                "character_count": len(extracted_text),
                "languages": self.languages,
                "preprocessing_applied": preprocess,
                "extraction_successful": len(extracted_text.strip()) > 0,
                "method": "tesseract_ocr"
            }
            
            logger.info(f"OCR completed: {len(extracted_text)} characters, confidence: {confidence_data['average_confidence']:.2f}")
            return result
            
        except Exception as e:
            logger.error(f"OCR extraction failed: {str(e)}", exc_info=True)
            return {
                "text": "",
                "confidence": 0.0,
                "error": str(e),
                "extraction_successful": False,
                "method": "tesseract_error"
            }
    
    async def _preprocess_image(self, image_path: Path) -> Image.Image:
        """Preprocess image for better OCR accuracy."""
        try:
            # Load image
            image = Image.open(image_path)
            
            # Convert to RGB if necessary
            if image.mode != 'RGB':
                image = image.convert('RGB')
            
            # Apply preprocessing steps
            
            # 1. Enhance contrast
            enhancer = ImageEnhance.Contrast(image)
            image = enhancer.enhance(1.5)
            
            # 2. Enhance sharpness
            enhancer = ImageEnhance.Sharpness(image)
            image = enhancer.enhance(2.0)
            
            # 3. Convert to grayscale for better OCR
            image = image.convert('L')
            
            # 4. Apply additional processing with OpenCV if available
            if CV2_AVAILABLE:
                image = await self._opencv_preprocessing(image)
            
            logger.info("Image preprocessing completed")
            return image
            
        except Exception as e:
            logger.error(f"Image preprocessing failed: {str(e)}")
            # Return original image if preprocessing fails
            return Image.open(image_path)
    
    async def _opencv_preprocessing(self, pil_image: Image.Image) -> Image.Image:
        """Advanced preprocessing using OpenCV."""
        try:
            # Convert PIL to OpenCV format
            opencv_image = np.array(pil_image)
            
            # Apply Gaussian blur to remove noise
            opencv_image = cv2.GaussianBlur(opencv_image, (1, 1), 0)
            
            # Apply threshold to get better contrast
            _, opencv_image = cv2.threshold(
                opencv_image, 0, 255, cv2.THRESH_BINARY + cv2.THRESH_OTSU
            )
            
            # Apply morphological operations to clean up
            kernel = np.ones((1, 1), np.uint8)
            opencv_image = cv2.morphologyEx(opencv_image, cv2.MORPH_CLOSE, kernel)
            opencv_image = cv2.morphologyEx(opencv_image, cv2.MORPH_OPEN, kernel)
            
            # Convert back to PIL
            return Image.fromarray(opencv_image)
            
        except Exception as e:
            logger.error(f"OpenCV preprocessing failed: {str(e)}")
            return pil_image
    
    def _get_tesseract_config(self) -> str:
        """Get Tesseract configuration string."""
        config_options = [
            '--oem 3',  # Use default OCR Engine Mode
            '--psm 6',  # Assume a single uniform block of text
            '-c tessedit_char_whitelist=ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789.,;:!?()[]{}"-/ '
        ]
        
        return ' '.join(config_options)
    
    def _calculate_confidence(self, ocr_data: Dict[str, List], 
                            threshold: float) -> Dict[str, Any]:
        """Calculate confidence metrics from OCR data."""
        try:
            confidences = [int(conf) for conf in ocr_data['conf'] if int(conf) > 0]
            
            if not confidences:
                return {
                    "average_confidence": 0.0,
                    "high_confidence_text": "",
                    "low_confidence_regions": []
                }
            
            average_confidence = sum(confidences) / len(confidences) / 100.0
            
            # Extract high confidence text
            high_confidence_text = []
            low_confidence_regions = []
            
            for i, conf in enumerate(ocr_data['conf']):
                conf_score = int(conf) / 100.0
                text = ocr_data['text'][i].strip()
                
                if text and conf_score >= threshold:
                    high_confidence_text.append(text)
                elif text and conf_score < threshold:
                    low_confidence_regions.append({
                        "text": text,
                        "confidence": conf_score,
                        "bbox": {
                            "left": ocr_data['left'][i],
                            "top": ocr_data['top'][i],
                            "width": ocr_data['width'][i],
                            "height": ocr_data['height'][i]
                        }
                    })
            
            return {
                "average_confidence": average_confidence,
                "high_confidence_text": " ".join(high_confidence_text),
                "low_confidence_regions": low_confidence_regions
            }
            
        except Exception as e:
            logger.error(f"Confidence calculation failed: {str(e)}")
            return {"average_confidence": 0.0, "high_confidence_text": "", "low_confidence_regions": []}
    
    def _process_text_blocks(self, ocr_data: Dict[str, List], 
                           confidence_threshold: float) -> List[Dict[str, Any]]:
        """Process OCR data into structured text blocks."""
        try:
            text_blocks = []
            
            # Group text by blocks
            current_block = None
            
            for i in range(len(ocr_data['text'])):
                text = ocr_data['text'][i].strip()
                if not text:
                    continue
                
                conf = int(ocr_data['conf'][i]) / 100.0
                block_num = ocr_data['block_num'][i]
                
                # Start new block if block number changes
                if current_block is None or current_block['block_num'] != block_num:
                    if current_block is not None:
                        text_blocks.append(current_block)
                    
                    current_block = {
                        "block_num": block_num,
                        "text": [],
                        "bbox": {
                            "left": ocr_data['left'][i],
                            "top": ocr_data['top'][i],
                            "right": ocr_data['left'][i] + ocr_data['width'][i],
                            "bottom": ocr_data['top'][i] + ocr_data['height'][i]
                        },
                        "confidence": [],
                        "high_confidence": conf >= confidence_threshold
                    }
                
                # Add text to current block
                current_block['text'].append(text)
                current_block['confidence'].append(conf)
                
                # Expand bounding box
                current_block['bbox']['left'] = min(current_block['bbox']['left'], ocr_data['left'][i])
                current_block['bbox']['top'] = min(current_block['bbox']['top'], ocr_data['top'][i])
                current_block['bbox']['right'] = max(current_block['bbox']['right'], 
                                                   ocr_data['left'][i] + ocr_data['width'][i])
                current_block['bbox']['bottom'] = max(current_block['bbox']['bottom'], 
                                                    ocr_data['top'][i] + ocr_data['height'][i])
            
            # Add final block
            if current_block is not None:
                text_blocks.append(current_block)
            
            # Post-process blocks
            for block in text_blocks:
                block['full_text'] = ' '.join(block['text'])
                block['average_confidence'] = sum(block['confidence']) / len(block['confidence'])
                block['word_count'] = len(block['text'])
            
            return text_blocks
            
        except Exception as e:
            logger.error(f"Text block processing failed: {str(e)}")
            return []
    
    async def extract_from_pdf_page(self, pdf_path: Path, page_number: int) -> Dict[str, Any]:
        """Extract text from a specific PDF page using OCR."""
        try:
            logger.info(f"Performing OCR on PDF page {page_number}: {pdf_path.name}")
            
            if not PIL_AVAILABLE:
                raise RuntimeError("PIL not available for PDF to image conversion")
            
            # Convert PDF page to image
            with tempfile.TemporaryDirectory() as temp_dir:
                # Use pdf2image if available, otherwise skip
                try:
                    from pdf2image import convert_from_path
                    
                    pages = convert_from_path(
                        pdf_path, 
                        first_page=page_number,
                        last_page=page_number,
                        dpi=300  # High DPI for better OCR
                    )
                    
                    if not pages:
                        raise ValueError(f"Could not convert PDF page {page_number} to image")
                    
                    # Save page as temporary image
                    temp_image_path = Path(temp_dir) / f"page_{page_number}.png"
                    pages[0].save(temp_image_path, 'PNG')
                    
                    # Perform OCR on the image
                    result = await self.extract_text(temp_image_path)
                    result["source_page"] = page_number
                    result["source_pdf"] = str(pdf_path)
                    
                    return result
                    
                except ImportError:
                    logger.error("pdf2image not available for PDF to image conversion")
                    return {
                        "text": "",
                        "confidence": 0.0,
                        "error": "pdf2image not available",
                        "extraction_successful": False
                    }
                    
        except Exception as e:
            logger.error(f"PDF page OCR failed: {str(e)}")
            return {
                "text": "",
                "confidence": 0.0,
                "error": str(e),
                "extraction_successful": False
            }
    
    async def batch_extract(self, image_paths: List[Path]) -> List[Dict[str, Any]]:
        """Extract text from multiple images in parallel."""
        try:
            logger.info(f"Starting batch OCR for {len(image_paths)} images")
            
            # Limit concurrent OCR operations
            semaphore = asyncio.Semaphore(2)  # Max 2 concurrent OCR operations
            
            async def extract_single_image(image_path: Path) -> Dict[str, Any]:
                async with semaphore:
                    result = await self.extract_text(image_path)
                    result["file_path"] = str(image_path)
                    return result
            
            # Execute all extractions
            tasks = [extract_single_image(image_path) for image_path in image_paths]
            results = await asyncio.gather(*tasks, return_exceptions=True)
            
            # Handle exceptions
            processed_results = []
            for i, result in enumerate(results):
                if isinstance(result, Exception):
                    logger.error(f"Batch OCR failed for image {i}: {str(result)}")
                    processed_results.append({
                        "file_path": str(image_paths[i]) if i < len(image_paths) else "unknown",
                        "text": "",
                        "confidence": 0.0,
                        "error": str(result),
                        "extraction_successful": False
                    })
                else:
                    processed_results.append(result)
            
            logger.info(f"Batch OCR completed: {len(processed_results)} images processed")
            return processed_results
            
        except Exception as e:
            logger.error(f"Batch OCR failed: {str(e)}")
            return [{"error": str(e), "extraction_successful": False}]
    
    def is_supported_format(self, file_path: Path) -> bool:
        """Check if file format is supported for OCR."""
        return file_path.suffix.lower() in self.supported_formats
    
    def get_supported_formats(self) -> List[str]:
        """Get list of supported image formats."""
        return self.supported_formats.copy()
    
    async def test_ocr_availability(self) -> Dict[str, bool]:
        """Test availability of OCR dependencies."""
        availability = {
            "tesseract": TESSERACT_AVAILABLE,
            "pil": PIL_AVAILABLE,
            "opencv": CV2_AVAILABLE
        }
        
        # Test Tesseract functionality if available
        if TESSERACT_AVAILABLE and PIL_AVAILABLE:
            try:
                # Create simple test image
                test_image = Image.new('RGB', (100, 30), color='white')
                test_text = pytesseract.image_to_string(test_image)
                availability["tesseract_functional"] = True
            except Exception as e:
                logger.error(f"Tesseract functionality test failed: {str(e)}")
                availability["tesseract_functional"] = False
        else:
            availability["tesseract_functional"] = False
        
        return availability
    
    def get_ocr_languages(self) -> List[str]:
        """Get list of available OCR languages."""
        if not TESSERACT_AVAILABLE:
            return []
        
        try:
            available_languages = pytesseract.get_languages()
            return available_languages
        except Exception as e:
            logger.error(f"Failed to get OCR languages: {str(e)}")
            return ['eng']  # Default fallback
