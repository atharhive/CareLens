# CareLens Backend

FastAPI-based backend for the CareLens AI-powered health risk assessment platform.

## Features

- **Health Risk Assessment**: AI models for diabetes, heart disease, and other conditions
- **Document Processing**: OCR and PDF parsing for lab reports
- **Provider Search**: Healthcare provider discovery and matching
- **Privacy Compliance**: HIPAA-compliant data handling with automatic deletion
- **API Documentation**: Automatic OpenAPI/Swagger documentation

## Quick Start

### Prerequisites
- Python 3.8+
- Redis (optional, for session management)

### Installation
```bash
# Install dependencies
pip install -r requirements.txt

# Copy environment configuration
cp .env.example .env

# Start the server
python -m uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

### Alternative Startup
```bash
python start_backend.py
```

## API Endpoints

### Health Check
- `GET /health` - Server health status

### Assessment Flow
- `POST /ingest/session` - Create assessment session
- `POST /ingest/session/{session_id}/data` - Update session data
- `POST /extract/upload` - Upload and process documents
- `POST /detect/analyze/{session_id}` - Run risk analysis
- `GET /detect/results/{session_id}` - Get assessment results

### Provider Search
- `GET /carefinder/search` - Search healthcare providers
- `GET /carefinder/providers/{provider_id}` - Get provider details

### Recommendations
- `GET /recommend/personalized/{session_id}` - Get personalized recommendations

### Result Sharing
- `POST /share/create/{session_id}` - Create shareable link
- `GET /share/{share_id}` - View shared results

## Configuration

Environment variables (`.env`):

```bash
# Core Settings
FASTAPI_ENV=development
DEBUG=true
SECRET_KEY=your-secret-key-here

# CORS Configuration
CORS_ORIGINS=["http://localhost:3000", "http://localhost:5000"]

# ML Configuration
MODEL_REGISTRY_PATH=./app/ml/models/registry.json
CALIBRATION_METHOD=isotonic

# Privacy Settings
SESSION_TTL_MINUTES=30
DATA_RETENTION_HOURS=0.5

# External APIs
GOOGLE_MAPS_API_KEY=your-api-key
REDIS_URL=redis://localhost:6379/0
```

## Architecture

```
backend/
├── app/
│   ├── main.py              # FastAPI application
│   ├── core/                # Core configuration and schemas
│   ├── routers/             # API route handlers
│   ├── ml/                  # Machine learning models and pipelines
│   ├── extract/             # Document processing
│   ├── services/            # Business logic services
│   └── rules/               # Rule-based recommendations
├── requirements.txt         # Python dependencies
├── .env                     # Environment configuration
└── start_backend.py         # Startup script
```

## Machine Learning Models

The backend includes specialized ML models for:
- **Diabetes Type 2**: Risk assessment based on HbA1c, glucose, BMI
- **Heart Disease**: Cardiovascular risk factors analysis
- **Kidney Disease**: Chronic kidney disease progression
- **Stroke**: Cerebrovascular risk assessment

All models include:
- Probability calibration for reliable risk scores
- SHAP explanations for transparency
- Confidence intervals for uncertainty quantification

## Document Processing

Supports processing of:
- PDF lab reports (table extraction with Camelot)
- Image documents (OCR with Tesseract)
- Structured data validation and unit conversion

## Privacy & Compliance

- **Temporary Storage**: All user data auto-deleted after 30 minutes
- **Anonymized Logging**: No PHI in application logs
- **Session-Based**: Stateless processing with session IDs
- **CORS Protection**: Restricted origins for security

## Development

### Running Tests
```bash
pytest tests/
```

### Code Quality
```bash
# Format code
black app/
isort app/

# Lint code
flake8 app/
```

### API Documentation
When running in development mode, access:
- Swagger UI: http://localhost:5000/docs
- ReDoc: http://localhost:5000/redoc

## Production Deployment

For production deployment:
1. Set `FASTAPI_ENV=production`
2. Use a production WSGI server (e.g., Gunicorn)
3. Configure Redis for session storage
4. Set up proper logging and monitoring
5. Use environment variables for secrets

```bash
# Production example
gunicorn app.main:app -w 4 -k uvicorn.workers.UvicornWorker --bind 0.0.0.0:8000
```