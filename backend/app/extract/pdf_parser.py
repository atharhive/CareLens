"""
PDF parsing module for medical document extraction.
Implements multi-stage PDF processing with table and text extraction.
"""

import logging
from pathlib import Path
from typing import Dict, List, Any, Optional, Tuple
import tempfile
import asyncio

# PDF processing imports with error handling
try:
    import pdfplumber
    PDFPLUMBER_AVAILABLE = True
except ImportError:
    PDFPLUMBER_AVAILABLE = False
    
try:
    import camelot
    CAMELOT_AVAILABLE = True
except ImportError:
    CAMELOT_AVAILABLE = False

import PyPDF2

logger = logging.getLogger(__name__)

class PDFParser:
    """
    Multi-stage PDF parser for medical documents.
    
    Extraction stages:
    1. Table extraction using Camelot
    2. Text extraction using pdfplumber
    3. Fallback text extraction using PyPDF2
    """
    
    def __init__(self):
        """Initialize PDF parser."""
        self.supported_formats = ['.pdf']
        
    async def extract_tables(self, pdf_path: Path) -> Dict[str, Any]:
        """
        Extract tables from PDF using Camelot.
        
        Args:
            pdf_path: Path to PDF file
            
        Returns:
            Dictionary containing extracted tables and metadata
        """
        try:
            logger.info(f"Extracting tables from PDF: {pdf_path.name}")
            
            if not CAMELOT_AVAILABLE:
                logger.warning("Camelot not available, skipping table extraction")
                return {"tables": [], "method": "camelot_unavailable", "pages_processed": 0}
            
            if not pdf_path.exists():
                raise FileNotFoundError(f"PDF file not found: {pdf_path}")
            
            # Extract tables using Camelot
            tables = camelot.read_pdf(
                str(pdf_path),
                flavor='lattice',  # Try lattice first (for bordered tables)
                pages='all'
            )
            
            # If no tables found with lattice, try stream method
            if len(tables) == 0:
                logger.info("No tables found with lattice method, trying stream method")
                tables = camelot.read_pdf(
                    str(pdf_path),
                    flavor='stream',  # For tables without borders
                    pages='all'
                )
            
            # Process extracted tables
            processed_tables = []
            for i, table in enumerate(tables):
                try:
                    # Get table data as pandas DataFrame
                    df = table.df
                    
                    # Convert to list of lists for easier processing
                    table_data = df.values.tolist()
                    headers = df.columns.tolist()
                    
                    table_info = {
                        "table_id": i,
                        "page": table.page,
                        "accuracy": table.accuracy,
                        "whitespace": table.whitespace,
                        "order": table.order,
                        "headers": headers,
                        "data": table_data,
                        "shape": df.shape,
                        "extraction_method": "camelot_" + tables.flavor
                    }
                    
                    processed_tables.append(table_info)
                    logger.info(f"Extracted table {i} from page {table.page} with accuracy {table.accuracy:.2f}")
                    
                except Exception as e:
                    logger.error(f"Failed to process table {i}: {str(e)}")
                    continue
            
            result = {
                "tables": processed_tables,
                "method": f"camelot_{tables.flavor}",
                "pages_processed": len(set(table.page for table in tables)) if tables else 0,
                "total_tables": len(processed_tables),
                "extraction_successful": len(processed_tables) > 0
            }
            
            logger.info(f"Table extraction completed: {len(processed_tables)} tables found")
            return result
            
        except Exception as e:
            logger.error(f"Table extraction failed: {str(e)}", exc_info=True)
            return {
                "tables": [],
                "method": "camelot_error",
                "error": str(e),
                "pages_processed": 0,
                "extraction_successful": False
            }
    
    async def extract_text(self, pdf_path: Path) -> Dict[str, Any]:
        """
        Extract text from PDF using pdfplumber.
        
        Args:
            pdf_path: Path to PDF file
            
        Returns:
            Dictionary containing extracted text and metadata
        """
        try:
            logger.info(f"Extracting text from PDF: {pdf_path.name}")
            
            if not pdf_path.exists():
                raise FileNotFoundError(f"PDF file not found: {pdf_path}")
            
            extracted_text = ""
            page_texts = []
            extraction_method = "pdfplumber"
            
            if PDFPLUMBER_AVAILABLE:
                # Use pdfplumber for text extraction
                with pdfplumber.open(pdf_path) as pdf:
                    for page_num, page in enumerate(pdf.pages):
                        try:
                            page_text = page.extract_text()
                            if page_text:
                                page_texts.append({
                                    "page_number": page_num + 1,
                                    "text": page_text,
                                    "char_count": len(page_text)
                                })
                                extracted_text += f"\n--- Page {page_num + 1} ---\n{page_text}\n"
                            
                        except Exception as e:
                            logger.warning(f"Failed to extract text from page {page_num + 1}: {str(e)}")
                            continue
            else:
                # Fallback to PyPDF2
                logger.warning("pdfplumber not available, using PyPDF2 fallback")
                extraction_method = "pypdf2_fallback"
                extracted_text, page_texts = await self._extract_text_pypdf2(pdf_path)
            
            result = {
                "text": extracted_text,
                "pages": page_texts,
                "method": extraction_method,
                "total_pages": len(page_texts),
                "total_characters": len(extracted_text),
                "extraction_successful": len(extracted_text.strip()) > 0
            }
            
            logger.info(f"Text extraction completed: {len(extracted_text)} characters from {len(page_texts)} pages")
            return result
            
        except Exception as e:
            logger.error(f"Text extraction failed: {str(e)}", exc_info=True)
            return {
                "text": "",
                "pages": [],
                "method": "extraction_error",
                "error": str(e),
                "extraction_successful": False
            }
    
    async def _extract_text_pypdf2(self, pdf_path: Path) -> Tuple[str, List[Dict[str, Any]]]:
        """Fallback text extraction using PyPDF2."""
        try:
            extracted_text = ""
            page_texts = []
            
            with open(pdf_path, 'rb') as file:
                pdf_reader = PyPDF2.PdfReader(file)
                
                for page_num, page in enumerate(pdf_reader.pages):
                    try:
                        page_text = page.extract_text()
                        if page_text:
                            page_texts.append({
                                "page_number": page_num + 1,
                                "text": page_text,
                                "char_count": len(page_text)
                            })
                            extracted_text += f"\n--- Page {page_num + 1} ---\n{page_text}\n"
                            
                    except Exception as e:
                        logger.warning(f"PyPDF2 failed on page {page_num + 1}: {str(e)}")
                        continue
            
            return extracted_text, page_texts
            
        except Exception as e:
            logger.error(f"PyPDF2 extraction failed: {str(e)}")
            return "", []
    
    async def extract_metadata(self, pdf_path: Path) -> Dict[str, Any]:
        """Extract metadata from PDF file."""
        try:
            logger.info(f"Extracting metadata from PDF: {pdf_path.name}")
            
            metadata = {}
            
            if PDFPLUMBER_AVAILABLE:
                with pdfplumber.open(pdf_path) as pdf:
                    metadata = {
                        "page_count": len(pdf.pages),
                        "pdf_metadata": pdf.metadata or {},
                        "method": "pdfplumber"
                    }
                    
                    # Get page dimensions
                    if pdf.pages:
                        first_page = pdf.pages[0]
                        metadata["page_dimensions"] = {
                            "width": first_page.width,
                            "height": first_page.height
                        }
            else:
                # Fallback to PyPDF2
                with open(pdf_path, 'rb') as file:
                    pdf_reader = PyPDF2.PdfReader(file)
                    metadata = {
                        "page_count": len(pdf_reader.pages),
                        "pdf_metadata": pdf_reader.metadata or {},
                        "method": "pypdf2_fallback"
                    }
            
            # Add file information
            file_stats = pdf_path.stat()
            metadata.update({
                "file_size": file_stats.st_size,
                "file_name": pdf_path.name,
                "file_extension": pdf_path.suffix
            })
            
            logger.info(f"PDF metadata extracted: {metadata.get('page_count', 0)} pages")
            return metadata
            
        except Exception as e:
            logger.error(f"Metadata extraction failed: {str(e)}")
            return {"error": str(e), "method": "extraction_failed"}
    
    async def extract_images(self, pdf_path: Path, extract_path: Optional[Path] = None) -> Dict[str, Any]:
        """Extract images from PDF for OCR processing."""
        try:
            logger.info(f"Extracting images from PDF: {pdf_path.name}")
            
            extracted_images = []
            
            if not PDFPLUMBER_AVAILABLE:
                logger.warning("pdfplumber not available, cannot extract images")
                return {"images": [], "method": "unavailable"}
            
            if extract_path is None:
                extract_path = Path(tempfile.mkdtemp())
            else:
                extract_path.mkdir(parents=True, exist_ok=True)
            
            with pdfplumber.open(pdf_path) as pdf:
                for page_num, page in enumerate(pdf.pages):
                    try:
                        # Extract images from page
                        if hasattr(page, 'images'):
                            for img_num, image in enumerate(page.images):
                                try:
                                    # Save image for OCR processing
                                    img_path = extract_path / f"page_{page_num + 1}_img_{img_num + 1}.png"
                                    
                                    # Extract image (simplified - actual implementation would need more work)
                                    extracted_images.append({
                                        "page_number": page_num + 1,
                                        "image_number": img_num + 1,
                                        "image_path": str(img_path),
                                        "bbox": image.get("bbox", []),
                                        "width": image.get("width"),
                                        "height": image.get("height")
                                    })
                                    
                                except Exception as e:
                                    logger.warning(f"Failed to extract image {img_num + 1} from page {page_num + 1}: {str(e)}")
                                    continue
                                    
                    except Exception as e:
                        logger.warning(f"Failed to process images on page {page_num + 1}: {str(e)}")
                        continue
            
            result = {
                "images": extracted_images,
                "method": "pdfplumber",
                "total_images": len(extracted_images),
                "extract_path": str(extract_path)
            }
            
            logger.info(f"Image extraction completed: {len(extracted_images)} images found")
            return result
            
        except Exception as e:
            logger.error(f"Image extraction failed: {str(e)}")
            return {"images": [], "method": "extraction_error", "error": str(e)}
    
    async def analyze_document_structure(self, pdf_path: Path) -> Dict[str, Any]:
        """Analyze PDF document structure for better extraction strategy."""
        try:
            logger.info(f"Analyzing document structure: {pdf_path.name}")
            
            analysis = {
                "has_tables": False,
                "has_forms": False,
                "has_images": False,
                "text_heavy": False,
                "recommended_extraction": "text",
                "confidence": 0.5
            }
            
            if not PDFPLUMBER_AVAILABLE:
                return analysis
            
            with pdfplumber.open(pdf_path) as pdf:
                total_text_length = 0
                table_indicators = 0
                form_indicators = 0
                image_count = 0
                
                for page in pdf.pages:
                    # Analyze text content
                    page_text = page.extract_text() or ""
                    total_text_length += len(page_text)
                    
                    # Look for table indicators
                    if any(indicator in page_text.lower() for indicator in 
                           ['test', 'result', 'value', 'normal', 'abnormal', 'range', 'units']):
                        table_indicators += 1
                    
                    # Look for form indicators
                    if any(indicator in page_text.lower() for indicator in 
                           ['name:', 'date:', 'id:', 'patient', 'dob:']):
                        form_indicators += 1
                    
                    # Check for images
                    if hasattr(page, 'images') and page.images:
                        image_count += len(page.images)
                
                # Make recommendations based on analysis
                analysis.update({
                    "has_tables": table_indicators > 0,
                    "has_forms": form_indicators > 0,
                    "has_images": image_count > 0,
                    "text_heavy": total_text_length > 1000,
                    "page_count": len(pdf.pages),
                    "total_text_length": total_text_length,
                    "table_indicators": table_indicators,
                    "form_indicators": form_indicators,
                    "image_count": image_count
                })
                
                # Determine recommended extraction method
                if table_indicators > len(pdf.pages) * 0.5:
                    analysis["recommended_extraction"] = "tables"
                    analysis["confidence"] = 0.8
                elif total_text_length > 500:
                    analysis["recommended_extraction"] = "text"
                    analysis["confidence"] = 0.7
                elif image_count > 0:
                    analysis["recommended_extraction"] = "ocr"
                    analysis["confidence"] = 0.6
                else:
                    analysis["recommended_extraction"] = "hybrid"
                    analysis["confidence"] = 0.5
            
            logger.info(f"Document analysis completed: {analysis['recommended_extraction']} extraction recommended")
            return analysis
            
        except Exception as e:
            logger.error(f"Document structure analysis failed: {str(e)}")
            return {"error": str(e), "recommended_extraction": "text", "confidence": 0.3}
    
    def is_pdf_file(self, file_path: Path) -> bool:
        """Check if file is a PDF."""
        return file_path.suffix.lower() == '.pdf'
    
    def get_supported_formats(self) -> List[str]:
        """Get list of supported file formats."""
        return self.supported_formats.copy()
    
    async def batch_extract(self, pdf_paths: List[Path]) -> List[Dict[str, Any]]:
        """Extract data from multiple PDFs in parallel."""
        try:
            logger.info(f"Starting batch PDF extraction for {len(pdf_paths)} files")
            
            results = []
            
            # Process PDFs concurrently (limit concurrency to avoid resource issues)
            semaphore = asyncio.Semaphore(3)  # Max 3 concurrent extractions
            
            async def extract_single_pdf(pdf_path: Path) -> Dict[str, Any]:
                async with semaphore:
                    try:
                        # Analyze document structure first
                        analysis = await self.analyze_document_structure(pdf_path)
                        
                        # Extract based on recommendation
                        if analysis["recommended_extraction"] == "tables":
                            tables = await self.extract_tables(pdf_path)
                            text = await self.extract_text(pdf_path)
                            return {
                                "file_path": str(pdf_path),
                                "tables": tables,
                                "text": text,
                                "analysis": analysis,
                                "primary_method": "tables"
                            }
                        else:
                            text = await self.extract_text(pdf_path)
                            tables = await self.extract_tables(pdf_path)
                            return {
                                "file_path": str(pdf_path),
                                "text": text,
                                "tables": tables,
                                "analysis": analysis,
                                "primary_method": "text"
                            }
                            
                    except Exception as e:
                        logger.error(f"Batch extraction failed for {pdf_path}: {str(e)}")
                        return {
                            "file_path": str(pdf_path),
                            "error": str(e),
                            "extraction_successful": False
                        }
            
            # Execute all extractions
            tasks = [extract_single_pdf(pdf_path) for pdf_path in pdf_paths]
            results = await asyncio.gather(*tasks, return_exceptions=True)
            
            # Handle any exceptions in results
            processed_results = []
            for i, result in enumerate(results):
                if isinstance(result, Exception):
                    logger.error(f"Batch extraction exception for file {i}: {str(result)}")
                    processed_results.append({
                        "file_path": str(pdf_paths[i]) if i < len(pdf_paths) else "unknown",
                        "error": str(result),
                        "extraction_successful": False
                    })
                else:
                    processed_results.append(result)
            
            logger.info(f"Batch PDF extraction completed: {len(processed_results)} files processed")
            return processed_results
            
        except Exception as e:
            logger.error(f"Batch PDF extraction failed: {str(e)}", exc_info=True)
            return [{"error": str(e), "extraction_successful": False}]
