"""
Main entry point for the FastAPI health risk assessment application.
This file handles the server startup and can be run directly with uvicorn.
"""
import uvicorn
from app.main import app

if __name__ == "__main__":
    uvicorn.run(
        "app.main:app",
        host="0.0.0.0",
        port=8000,
        reload=False,
        workers=1,
        access_log=True,
        log_level="info"
    )
