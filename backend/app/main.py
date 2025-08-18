"""
FastAPI application factory and configuration.
Main application setup with middleware, routers, and startup/shutdown events.
"""
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.middleware.trustedhost import TrustedHostMiddleware
from fastapi.responses import JSONResponse
import logging
import time
import uuid
from contextlib import asynccontextmanager

from app.core.config import settings
from app.core.exceptions import (
    ModelException, 
    DocumentError, 
    ValidationException,
    PrivacyException
)
from app.ml.registry import ModelRegistry
from app.core.privacy import PrivacyManager

from app.routers import (
    ingest,
    extract, 
    detect,
    triage,
    recommend,
    carefinder,
    share,
    health
)

# Configure logging for HIPAA compliance
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[
        logging.StreamHandler(),
        logging.FileHandler('healthcare_app.log')
    ]
)
logger = logging.getLogger(__name__)

# Global instances
model_registry = None
privacy_manager = None

@asynccontextmanager
async def lifespan(app: FastAPI):
    """
    Application startup and shutdown event handler.
    Manages model loading and cleanup operations.
    """
    global model_registry, privacy_manager
    
    # Startup
    logger.info("Starting healthcare risk assessment API...")
    
    try:
        # Initialize privacy manager
        privacy_manager = PrivacyManager()
        logger.info("Privacy manager initialized")
        
        # Initialize model registry
        model_registry = ModelRegistry()
        await model_registry.initialize()
        logger.info("Model registry initialized")
        
        # Store in app state
        app.state.model_registry = model_registry
        app.state.privacy_manager = privacy_manager
        
        logger.info("Application startup completed successfully")
        
    except Exception as e:
        logger.error(f"Failed to initialize application: {e}")
        raise
    
    yield
    
    # Shutdown
    logger.info("Shutting down healthcare risk assessment API...")
    
    if privacy_manager:
        await privacy_manager.cleanup_all_sessions()
        logger.info("Privacy manager cleaned up")
    
    if model_registry:
        model_registry.cleanup()
        logger.info("Model registry cleaned up")
    
    logger.info("Application shutdown completed")

# Create FastAPI application
app = FastAPI(
    title="Healthcare Risk Assessment API",
    description="HIPAA-compliant AI-powered health risk assessment platform",
    version="1.0.0",
    docs_url="/docs" if settings.DEBUG else None,
    redoc_url="/redoc" if settings.DEBUG else None,
    lifespan=lifespan
)

# Add security middleware
app.add_middleware(
    TrustedHostMiddleware, 
    allowed_hosts=settings.ALLOWED_HOSTS
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=False,  # Never allow credentials for HIPAA compliance
    allow_methods=["GET", "POST"],
    allow_headers=["*"],
)

@app.middleware("http")
async def add_request_id_middleware(request: Request, call_next):
    """
    Add unique request ID for audit logging and tracing.
    Essential for HIPAA compliance and debugging.
    """
    request_id = str(uuid.uuid4())
    request.state.request_id = request_id
    
    # Add to response headers
    response = await call_next(request)
    response.headers["X-Request-ID"] = request_id
    
    return response

@app.middleware("http")
async def logging_middleware(request: Request, call_next):
    """
    Log all requests for audit trail (HIPAA requirement).
    Excludes sensitive data from logs.
    """
    start_time = time.time()
    
    # Log request (without sensitive data)
    logger.info(
        f"Request: {request.method} {request.url.path} "
        f"- RequestID: {getattr(request.state, 'request_id', 'unknown')}"
    )
    
    response = await call_next(request)
    
    # Log response
    process_time = time.time() - start_time
    logger.info(
        f"Response: {response.status_code} "
        f"- Time: {process_time:.4f}s "
        f"- RequestID: {getattr(request.state, 'request_id', 'unknown')}"
    )
    
    return response

# Exception handlers
@app.exception_handler(ValidationException)
async def validation_exception_handler(request: Request, exc: ValidationException):
    """Handle validation errors with detailed feedback."""
    request_id = getattr(request.state, 'request_id', 'unknown')
    logger.warning(f"Validation error - RequestID: {request_id} - {exc.detail}")
    
    return JSONResponse(
        status_code=400,
        content={
            "error": "Validation Error",
            "detail": exc.detail,
            "request_id": request_id,
            "timestamp": time.time()
        }
    )

@app.exception_handler(ModelException)
async def model_exception_handler(request: Request, exc: ModelException):
    """Handle ML model errors."""
    request_id = getattr(request.state, 'request_id', 'unknown')
    logger.error(f"Model error - RequestID: {request_id} - {exc.detail}")
    
    return JSONResponse(
        status_code=500,
        content={
            "error": "Model Processing Error",
            "detail": "Unable to process risk assessment. Please try again.",
            "request_id": request_id,
            "timestamp": time.time()
        }
    )

@app.exception_handler(DocumentError)
async def document_exception_handler(request: Request, exc: DocumentError):
    """Handle document processing errors."""
    request_id = getattr(request.state, 'request_id', 'unknown')
    logger.error(f"Document error - RequestID: {request_id} - {exc.detail}")
    
    return JSONResponse(
        status_code=422,
        content={
            "error": "Document Processing Error",
            "detail": exc.detail,
            "request_id": request_id,
            "timestamp": time.time()
        }
    )

@app.exception_handler(PrivacyException)
async def privacy_exception_handler(request: Request, exc: PrivacyException):
    """Handle privacy and session management errors."""
    request_id = getattr(request.state, 'request_id', 'unknown')
    logger.error(f"Privacy error - RequestID: {request_id} - {exc.detail}")
    
    return JSONResponse(
        status_code=403,
        content={
            "error": "Privacy Error",
            "detail": exc.detail,
            "request_id": request_id,
            "timestamp": time.time()
        }
    )

# Include routers
app.include_router(health.router, prefix="/health", tags=["Health"])
app.include_router(ingest.router, prefix="/ingest", tags=["Data Ingestion"])
app.include_router(extract.router, prefix="/extract", tags=["Document Processing"])
app.include_router(detect.router, prefix="/detect", tags=["Risk Detection"])
app.include_router(triage.router, prefix="/triage", tags=["Triage"])
app.include_router(recommend.router, prefix="/recommend", tags=["Recommendations"])
app.include_router(carefinder.router, prefix="/carefinder", tags=["Care Finder"])
app.include_router(share.router, prefix="/share", tags=["Result Sharing"])

@app.get("/")
async def root():
    """Root endpoint with API information."""
    return {
        "service": "Healthcare Risk Assessment API",
        "version": "1.0.0",
        "status": "operational",
        "docs": "/docs" if settings.DEBUG else "Contact administrator for API documentation"
    }
