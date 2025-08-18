"""
Result sharing router for creating shareable links and reports.
Privacy-controlled sharing with expiration and access controls.
"""

import logging
from datetime import datetime, timedelta
from typing import Optional, Dict, Any

from fastapi import APIRouter, HTTPException, Depends, Request, Path
from fastapi.responses import JSONResponse, HTMLResponse
from fastapi.templating import Jinja2Templates

from app.core.schemas import ShareRequest, ShareResponse, ErrorResponse
from app.core.privacy import PrivacyManager
from app.core.security import SecurityManager
from app.core.config import settings

logger = logging.getLogger(__name__)
router = APIRouter()

# Initialize templates for shared reports
templates = Jinja2Templates(directory="templates") if settings.DEBUG else None

def get_privacy_manager(request: Request) -> PrivacyManager:
    """Dependency to get privacy manager."""
    return request.app.state.privacy_manager

def get_security_manager(request: Request) -> SecurityManager:
    """Dependency to get security manager."""
    return request.app.state.security_manager

@router.post("/create", response_model=ShareResponse)
async def create_share_link(
    share_request: ShareRequest,
    request: Request,
    privacy_manager: PrivacyManager = Depends(get_privacy_manager),
    security_manager: SecurityManager = Depends(get_security_manager)
):
    """
    Create a shareable link for health assessment results.
    
    - Creates secure, time-limited sharing links
    - Supports privacy controls for personal information inclusion
    - Optional password protection for sensitive results
    - Automatic expiration based on configured limits
    """
    try:
        request_id = getattr(request.state, 'request_id', 'unknown')
        logger.info(f"Creating share link - Session: {share_request.session_id}, Request: {request_id}")
        
        # Validate session exists and has results
        session_data = await privacy_manager.get_session(share_request.session_id)
        if not session_data:
            raise HTTPException(status_code=404, detail="Session not found or expired")
        
        # Check if session has assessment results
        if not session_data.get("risk_assessments"):
            raise HTTPException(
                status_code=400,
                detail="No assessment results available to share"
            )
        
        # Validate expiry period
        max_expiry_days = settings.SHARE_LINK_MAX_DAYS
        if share_request.expiry_days > max_expiry_days:
            raise HTTPException(
                status_code=400,
                detail=f"Maximum expiry period is {max_expiry_days} days"
            )
        
        # Create shareable link
        share_id = await privacy_manager.create_share_link(
            session_id=share_request.session_id,
            expiry_days=share_request.expiry_days,
            include_personal_info=share_request.include_personal_info
        )
        
        if not share_id:
            raise HTTPException(
                status_code=500,
                detail="Failed to create share link"
            )
        
        # Generate share URL
        base_url = request.url.scheme + "://" + request.url.netloc
        share_url = f"{base_url}/api/v1/share/view/{share_id}"
        
        # Calculate expiration time
        expires_at = datetime.utcnow() + timedelta(days=share_request.expiry_days)
        
        # Generate password if requested
        password_required = share_request.password_protect
        share_password = None
        if password_required:
            share_password = security_manager.generate_secure_id(8)
            # Store password hash with share data
            password_hash = security_manager.hash_password(share_password)
            await _store_share_password(share_id, password_hash, privacy_manager)
        
        # Log security event
        security_manager.log_security_event(
            "share_link_created",
            {
                "session_id": share_request.session_id,
                "share_id": share_id,
                "expiry_days": share_request.expiry_days,
                "password_protected": password_required,
                "includes_personal_info": share_request.include_personal_info
            },
            request_id
        )
        
        response = ShareResponse(
            share_id=share_id,
            share_url=share_url,
            expires_at=expires_at,
            password_required=password_required
        )
        
        # Include password in response if generated
        if share_password:
            response_dict = response.dict()
            response_dict["share_password"] = share_password
            response_dict["password_note"] = "Share this password separately for security"
            return JSONResponse(content=response_dict)
        
        logger.info(f"Share link created: {share_id} for session: {share_request.session_id}")
        return response
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Share link creation failed: {str(e)}", exc_info=True)
        raise HTTPException(
            status_code=500,
            detail="Failed to create share link"
        )

@router.get("/view/{share_id}")
async def view_shared_results(
    share_id: str = Path(..., description="Share link identifier"),
    password: Optional[str] = None,
    format: str = "html",
    request: Request = None,
    privacy_manager: PrivacyManager = Depends(get_privacy_manager),
    security_manager: SecurityManager = Depends(get_security_manager)
):
    """
    View shared health assessment results.
    
    - Validates share link and expiration
    - Checks password if required
    - Returns formatted results (HTML or JSON)
    - Logs access for audit purposes
    """
    try:
        request_id = getattr(request.state, 'request_id', 'unknown')
        logger.info(f"Viewing shared results - Share ID: {share_id}, Request: {request_id}")
        
        # Get shared data
        shared_data = await _get_shared_data(share_id, privacy_manager)
        if not shared_data:
            raise HTTPException(status_code=404, detail="Share link not found or expired")
        
        # Check password if required
        if shared_data.get("password_required"):
            if not password:
                raise HTTPException(
                    status_code=401,
                    detail="Password required to access this shared report"
                )
            
            stored_password_hash = await _get_share_password(share_id, privacy_manager)
            if not stored_password_hash or not security_manager.verify_password(password, stored_password_hash):
                raise HTTPException(status_code=401, detail="Invalid password")
        
        # Get assessment results
        assessment_data = shared_data["data"]
        
        # Log access for audit
        security_manager.audit_data_access(
            session_id=shared_data["original_session"],
            access_type="shared_link_access",
            user_agent=request.headers.get("user-agent")
        )
        
        # Format response based on requested format
        if format.lower() == "json":
            return JSONResponse(content={
                "share_id": share_id,
                "assessment_results": assessment_data,
                "shared_at": shared_data["created_at"],
                "includes_personal_info": shared_data["include_personal_info"]
            })
        else:
            # Return HTML formatted report
            return await _generate_html_report(share_id, assessment_data, shared_data, request)
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Shared results access failed: {str(e)}", exc_info=True)
        raise HTTPException(
            status_code=500,
            detail="Failed to access shared results"
        )

@router.get("/status/{share_id}")
async def get_share_status(
    share_id: str = Path(..., description="Share link identifier"),
    request: Request = None,
    privacy_manager: PrivacyManager = Depends(get_privacy_manager)
):
    """
    Get status information about a share link.
    
    Returns information about expiration, access requirements,
    and validity without exposing actual results.
    """
    try:
        request_id = getattr(request.state, 'request_id', 'unknown')
        logger.info(f"Checking share status - Share ID: {share_id}, Request: {request_id}")
        
        # Check if share exists in Redis
        shared_data = await _get_shared_data(share_id, privacy_manager)
        
        if not shared_data:
            return JSONResponse(content={
                "share_id": share_id,
                "status": "not_found",
                "message": "Share link not found or has expired"
            })
        
        # Get TTL from Redis
        ttl_seconds = await privacy_manager.redis.ttl(f"share:{share_id}")
        
        status_info = {
            "share_id": share_id,
            "status": "active",
            "created_at": shared_data["created_at"],
            "expires_in_seconds": ttl_seconds if ttl_seconds > 0 else 0,
            "password_required": shared_data.get("password_required", False),
            "includes_personal_info": shared_data["include_personal_info"],
            "original_session": shared_data["original_session"]
        }
        
        return JSONResponse(content=status_info)
        
    except Exception as e:
        logger.error(f"Share status check failed: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail="Failed to check share status"
        )

@router.delete("/revoke/{share_id}")
async def revoke_share_link(
    share_id: str = Path(..., description="Share link identifier"),
    session_id: str = None,
    request: Request = None,
    privacy_manager: PrivacyManager = Depends(get_privacy_manager),
    security_manager: SecurityManager = Depends(get_security_manager)
):
    """
    Revoke a share link before its expiration.
    
    Allows users to manually revoke access to shared results
    for security purposes.
    """
    try:
        request_id = getattr(request.state, 'request_id', 'unknown')
        logger.info(f"Revoking share link - Share ID: {share_id}, Request: {request_id}")
        
        # Verify ownership if session_id provided
        if session_id:
            shared_data = await _get_shared_data(share_id, privacy_manager)
            if shared_data and shared_data["original_session"] != session_id:
                raise HTTPException(
                    status_code=403,
                    detail="Not authorized to revoke this share link"
                )
        
        # Delete share data from Redis
        deleted_count = await privacy_manager.redis.delete(f"share:{share_id}")
        
        if deleted_count == 0:
            raise HTTPException(status_code=404, detail="Share link not found")
        
        # Also delete password if it exists
        await privacy_manager.redis.delete(f"share_password:{share_id}")
        
        # Log security event
        security_manager.log_security_event(
            "share_link_revoked",
            {
                "share_id": share_id,
                "session_id": session_id,
                "revoked_by": "user"
            },
            request_id
        )
        
        logger.info(f"Share link revoked: {share_id}")
        return JSONResponse(content={
            "share_id": share_id,
            "status": "revoked",
            "message": "Share link has been successfully revoked"
        })
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Share link revocation failed: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail="Failed to revoke share link"
        )

async def _get_shared_data(share_id: str, privacy_manager: PrivacyManager) -> Optional[Dict[str, Any]]:
    """Get shared data from Redis."""
    try:
        import json
        shared_data = await privacy_manager.redis.get(f"share:{share_id}")
        if shared_data:
            return json.loads(shared_data)
        return None
    except Exception as e:
        logger.error(f"Failed to get shared data: {str(e)}")
        return None

async def _store_share_password(share_id: str, password_hash: str, privacy_manager: PrivacyManager):
    """Store password hash for share link."""
    try:
        await privacy_manager.redis.setex(
            f"share_password:{share_id}",
            timedelta(days=settings.SHARE_LINK_MAX_DAYS),
            password_hash
        )
    except Exception as e:
        logger.error(f"Failed to store share password: {str(e)}")

async def _get_share_password(share_id: str, privacy_manager: PrivacyManager) -> Optional[str]:
    """Get password hash for share link."""
    try:
        password_hash = await privacy_manager.redis.get(f"share_password:{share_id}")
        return password_hash.decode() if password_hash else None
    except Exception as e:
        logger.error(f"Failed to get share password: {str(e)}")
        return None

async def _generate_html_report(
    share_id: str, 
    assessment_data: Dict[str, Any], 
    shared_data: Dict[str, Any],
    request: Request
) -> HTMLResponse:
    """Generate HTML report for shared results."""
    try:
        # Create a simple HTML report
        html_content = f"""
        <!DOCTYPE html>
        <html lang="en">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Health Risk Assessment Report</title>
            <style>
                body {{ font-family: Arial, sans-serif; max-width: 800px; margin: 0 auto; padding: 20px; }}
                .header {{ background-color: #f8f9fa; padding: 20px; border-radius: 8px; margin-bottom: 20px; }}
                .risk-score {{ background-color: #e9ecef; padding: 15px; margin: 10px 0; border-radius: 5px; }}
                .high-risk {{ border-left: 5px solid #dc3545; }}
                .moderate-risk {{ border-left: 5px solid #ffc107; }}
                .low-risk {{ border-left: 5px solid #28a745; }}
                .footer {{ margin-top: 30px; padding: 15px; background-color: #f8f9fa; border-radius: 5px; font-size: 0.9em; }}
                .disclaimer {{ color: #6c757d; font-style: italic; }}
            </style>
        </head>
        <body>
            <div class="header">
                <h1>Health Risk Assessment Report</h1>
                <p><strong>Report ID:</strong> {share_id}</p>
                <p><strong>Generated:</strong> {shared_data['created_at']}</p>
            </div>
            
            <div class="content">
                <h2>Risk Assessment Results</h2>
                {_format_assessment_results(assessment_data)}
            </div>
            
            <div class="footer">
                <p class="disclaimer">
                    <strong>Important:</strong> This assessment is for informational purposes only and does not replace professional medical advice. 
                    Please consult with a healthcare provider for proper medical evaluation and treatment.
                </p>
                <p><small>Report generated by AI Health Risk Assessment Platform</small></p>
            </div>
        </body>
        </html>
        """
        
        return HTMLResponse(content=html_content)
        
    except Exception as e:
        logger.error(f"HTML report generation failed: {str(e)}")
        # Return simple error page
        error_html = """
        <html><body>
        <h1>Report Generation Error</h1>
        <p>Unable to generate the assessment report. Please try again later.</p>
        </body></html>
        """
        return HTMLResponse(content=error_html, status_code=500)

def _format_assessment_results(assessment_data: Dict[str, Any]) -> str:
    """Format assessment results for HTML display."""
    try:
        html_parts = []
        
        # Format risk scores
        risk_assessments = assessment_data.get("risk_assessments", {})
        risk_scores = risk_assessments.get("risk_scores", [])
        
        if risk_scores:
            for risk_score in risk_scores:
                condition = risk_score.get("condition", "Unknown")
                score = risk_score.get("risk_score", 0)
                risk_level = risk_score.get("risk_level", "unknown")
                
                css_class = f"{risk_level.lower()}-risk" if risk_level != "unknown" else ""
                
                html_parts.append(f"""
                <div class="risk-score {css_class}">
                    <h3>{condition.replace('_', ' ').title()}</h3>
                    <p><strong>Risk Score:</strong> {score:.1%}</p>
                    <p><strong>Risk Level:</strong> {risk_level.title()}</p>
                </div>
                """)
        
        # Format overall assessment
        overall_assessment = risk_assessments.get("overall_assessment", "")
        if overall_assessment:
            html_parts.append(f"""
            <div class="risk-score">
                <h3>Overall Assessment</h3>
                <p>{overall_assessment}</p>
            </div>
            """)
        
        return "".join(html_parts) if html_parts else "<p>No assessment results available.</p>"
        
    except Exception as e:
        logger.error(f"Assessment formatting failed: {str(e)}")
        return "<p>Error formatting assessment results.</p>"
