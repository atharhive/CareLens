# Backend Documentation

This document provides an overview of the CareLens backend application.

## Technology Stack

- **Framework:** [FastAPI](https://fastapi.tiangolo.com/)
- **Language:** [Python](https://www.python.org/)
- **Machine Learning:** [scikit-learn](https://scikit-learn.org/), [XGBoost](https://xgboost.ai/), [LightGBM](https://lightgbm.readthedocs.io/)
- **Document Processing:** [pdfplumber](https://github.com/jsvine/pdfplumber), [camelot-py](https://github.com/camelot-dev/camelot), [pytesseract](https://pypi.org/project/pytesseract/)
- **Caching:** [Redis](https://redis.io/)

## Project Structure

```
backend/
├── app/                    # Main application code
│   ├── main.py             # FastAPI application factory
│   ├── routers/            # API routers
│   ├── core/               # Core components (config, security)
│   └── ml/                 # Machine learning models and pipelines
├── tests/                  # Unit and integration tests
├── requirements.txt        # Python dependencies
└── Dockerfile              # Docker configuration
```

## Getting Started

1.  **Create a virtual environment:**

    ```bash
    python -m venv venv
    source venv/bin/activate  # Windows: venv\Scripts\activate
    ```

2.  **Install dependencies:**

    ```bash
    pip install -r requirements.txt
    ```

3.  **Run the development server:**

    ```bash
    uvicorn app.main:app --reload --port 8000
    ```

    The API will be available at [http://localhost:8000](http://localhost:8000).
