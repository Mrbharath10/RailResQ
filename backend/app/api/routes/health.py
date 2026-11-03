import datetime
import platform
from fastapi import APIRouter
from app.core.config import settings

router = APIRouter(prefix="/health", tags=["Health & System Diagnostics"])


@router.get("", summary="System Health & Diagnostic Check")
async def get_system_health():
    """
    Returns the real-time operational status of the RailResQ backend system,
    including version, platform environment, system time, and academic prototype disclaimer.
    """
    return {
        "status": "healthy",
        "system": settings.PROJECT_NAME,
        "version": settings.VERSION,
        "environment": settings.ENVIRONMENT,
        "timestamp": datetime.datetime.now(datetime.timezone.utc).isoformat(),
        "platform": {
            "os": platform.system(),
            "python": platform.python_version(),
        },
        "services": {
            "fastapi": "operational",
            "database": "simulated_local",
            "ai_agent_pipeline": "ready",
        },
        "disclaimer": settings.DISCLAIMER,
    }
