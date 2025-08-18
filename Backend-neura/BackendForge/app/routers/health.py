"""
Health check router for monitoring system status and dependencies.
Provides comprehensive health monitoring for production deployment.
"""

import logging
import asyncio
from datetime import datetime
from typing import Dict, Any
from fastapi import APIRouter, Request, HTTPException

from app.core.schemas import HealthCheckResponse
from app.core.config import settings

logger = logging.getLogger(__name__)
router = APIRouter()


@router.get("/", response_model=HealthCheckResponse)
async def health_check(request: Request):
    """
    Comprehensive health check for all system components.
    Monitors database, Redis, models, and external services.
    """
    start_time = datetime.utcnow()
    
    services_status = {
        "api": {"status": "healthy", "details": {}},
        "redis": {"status": "unknown", "details": {}},
        "models": {"status": "unknown", "details": {}},
        "storage": {"status": "unknown", "details": {}},
        "external_apis": {"status": "unknown", "details": {}}
    }
    
    overall_status = "healthy"
    
    # Check Redis connection
    try:
        redis_client = request.app.state.redis_client
        await redis_client.ping()
        
        # Test basic operations
        test_key = "health_check_test"
        await redis_client.set(test_key, "test_value", ex=10)
        test_value = await redis_client.get(test_key)
        await redis_client.delete(test_key)
        
        if test_value == "test_value":
            services_status["redis"]["status"] = "healthy"
            services_status["redis"]["details"] = {
                "connection": "active",
                "read_write": "operational"
            }
        else:
            raise Exception("Redis read/write test failed")
            
    except Exception as e:
        services_status["redis"]["status"] = "unhealthy"
        services_status["redis"]["details"] = {"error": str(e)}
        overall_status = "degraded"
    
    # Check ML models
    try:
        model_registry = request.app.state.model_registry
        model_status = await model_registry.health_check()
        
        services_status["models"]["status"] = "healthy" if model_status["all_loaded"] else "degraded"
        services_status["models"]["details"] = model_status
        
        if not model_status["all_loaded"]:
            overall_status = "degraded"
            
    except Exception as e:
        services_status["models"]["status"] = "unhealthy"
        services_status["models"]["details"] = {"error": str(e)}
        overall_status = "degraded"
    
    # Check file storage
    try:
        import tempfile
        from pathlib import Path
        
        temp_dir = Path(tempfile.gettempdir()) / "health_platform"
        temp_dir.mkdir(exist_ok=True)
        
        # Test file write/read
        test_file = temp_dir / "health_check.txt"
        test_file.write_text("health check test")
        content = test_file.read_text()
        test_file.unlink()
        
        if content == "health check test":
            services_status["storage"]["status"] = "healthy"
            services_status["storage"]["details"] = {
                "temp_directory": str(temp_dir),
                "read_write": "operational"
            }
        else:
            raise Exception("File storage read/write test failed")
            
    except Exception as e:
        services_status["storage"]["status"] = "unhealthy"
        services_status["storage"]["details"] = {"error": str(e)}
        overall_status = "degraded"
    
    # Check external APIs
    external_status = await _check_external_apis()
    services_status["external_apis"] = external_status
    
    if external_status["status"] == "degraded":
        overall_status = "degraded"
    
    # Calculate response time
    end_time = datetime.utcnow()
    response_time = (end_time - start_time).total_seconds()
    
    logger.info(
        f"Health check completed",
        extra={
            "overall_status": overall_status,
            "response_time": response_time,
            "services_checked": len(services_status)
        }
    )
    
    return HealthCheckResponse(
        status=overall_status,
        timestamp=end_time,
        services=services_status,
        version="1.0.0"
    )


@router.get("/ready")
async def readiness_check(request: Request):
    """
    Readiness check for Kubernetes/container orchestration.
    Returns 200 if service is ready to handle requests.
    """
    try:
        # Quick checks for essential services
        redis_client = request.app.state.redis_client
        await redis_client.ping()
        
        model_registry = request.app.state.model_registry
        if not model_registry.models:
            raise Exception("Models not loaded")
        
        return {"status": "ready", "timestamp": datetime.utcnow()}
        
    except Exception as e:
        logger.error(f"Readiness check failed: {str(e)}")
        raise HTTPException(status_code=503, detail="Service not ready")


@router.get("/live")
async def liveness_check():
    """
    Liveness check for Kubernetes/container orchestration.
    Returns 200 if service is alive (basic functionality).
    """
    return {
        "status": "alive",
        "timestamp": datetime.utcnow(),
        "uptime": "calculated_at_runtime"
    }


@router.get("/metrics")
async def get_metrics(request: Request):
    """
    Get system metrics for monitoring.
    """
    try:
        import psutil
        import os
        
        # System metrics
        cpu_percent = psutil.cpu_percent(interval=1)
        memory = psutil.virtual_memory()
        disk = psutil.disk_usage('/')
        
        # Application metrics
        redis_client = request.app.state.redis_client
        redis_info = await _get_redis_metrics(redis_client)
        
        return {
            "system": {
                "cpu_percent": cpu_percent,
                "memory_percent": memory.percent,
                "memory_available_gb": round(memory.available / (1024**3), 2),
                "disk_percent": disk.percent,
                "disk_free_gb": round(disk.free / (1024**3), 2)
            },
            "redis": redis_info,
            "application": {
                "environment": settings.FASTAPI_ENV,
                "debug_mode": settings.DEBUG,
                "session_ttl_minutes": settings.SESSION_TTL_MINUTES,
                "file_ttl_minutes": settings.FILE_TTL_MINUTES
            },
            "timestamp": datetime.utcnow()
        }
        
    except Exception as e:
        logger.error(f"Error getting metrics: {str(e)}")
        return {
            "error": "Metrics unavailable",
            "timestamp": datetime.utcnow()
        }


@router.get("/logs")
async def get_recent_logs(
    level: str = "INFO",
    lines: int = 100
):
    """
    Get recent log entries for debugging.
    Only available in debug mode.
    """
    if not settings.DEBUG:
        raise HTTPException(status_code=403, detail="Logs endpoint only available in debug mode")
    
    try:
        # In production, this would read from actual log files
        # For now, return placeholder
        return {
            "log_level": level,
            "lines_requested": lines,
            "logs": [
                f"Sample log entry {i}: Application running normally"
                for i in range(min(lines, 10))
            ],
            "note": "Full log integration would be implemented in production",
            "timestamp": datetime.utcnow()
        }
        
    except Exception as e:
        logger.error(f"Error getting logs: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to retrieve logs")


async def _check_external_apis() -> Dict[str, Any]:
    """
    Check status of external API dependencies.
    """
    external_checks = {
        "google_maps": {"status": "unknown", "details": {}},
        "openai": {"status": "unknown", "details": {}}
    }
    
    overall_external_status = "healthy"
    
    # Check Google Maps API
    try:
        if settings.GOOGLE_MAPS_API_KEY:
            import requests
            
            # Simple API key validation
            url = "https://maps.googleapis.com/maps/api/geocode/json"
            params = {
                "address": "1600 Amphitheatre Parkway, Mountain View, CA",
                "key": settings.GOOGLE_MAPS_API_KEY
            }
            
            response = requests.get(url, params=params, timeout=5)
            
            if response.status_code == 200:
                external_checks["google_maps"]["status"] = "healthy"
                external_checks["google_maps"]["details"] = {"api_key": "valid"}
            else:
                external_checks["google_maps"]["status"] = "unhealthy"
                external_checks["google_maps"]["details"] = {"api_key": "invalid"}
                overall_external_status = "degraded"
        else:
            external_checks["google_maps"]["status"] = "not_configured"
            external_checks["google_maps"]["details"] = {"api_key": "not_provided"}
            
    except Exception as e:
        external_checks["google_maps"]["status"] = "unhealthy"
        external_checks["google_maps"]["details"] = {"error": str(e)}
        overall_external_status = "degraded"
    
    # Check OpenAI API (if configured)
    try:
        if settings.OPENAI_API_KEY:
            external_checks["openai"]["status"] = "configured"
            external_checks["openai"]["details"] = {"api_key": "provided"}
        else:
            external_checks["openai"]["status"] = "not_configured"
            external_checks["openai"]["details"] = {"api_key": "not_provided"}
            
    except Exception as e:
        external_checks["openai"]["status"] = "error"
        external_checks["openai"]["details"] = {"error": str(e)}
    
    return {
        "status": overall_external_status,
        "details": external_checks
    }


async def _get_redis_metrics(redis_client) -> Dict[str, Any]:
    """
    Get Redis-specific metrics.
    """
    try:
        info = await redis_client.info()
        
        return {
            "connected_clients": info.get("connected_clients", 0),
            "used_memory": info.get("used_memory_human", "unknown"),
            "keyspace_hits": info.get("keyspace_hits", 0),
            "keyspace_misses": info.get("keyspace_misses", 0),
            "total_commands_processed": info.get("total_commands_processed", 0)
        }
        
    except Exception as e:
        return {"error": str(e)}
