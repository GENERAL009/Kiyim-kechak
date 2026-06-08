from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import text
from app.core.database import get_db, get_redis

router = APIRouter()

@router.get("")
def health_check(db: Session = Depends(get_db), redis_client = Depends(get_redis)):
    status_details = {
        "status": "healthy",
        "database": "unreachable",
        "redis": "unreachable"
    }
    
    # Test DB
    try:
        db.execute(text("SELECT 1"))
        status_details["database"] = "ok"
    except Exception as e:
        status_details["status"] = "unhealthy"
        status_details["database"] = f"error: {str(e)}"

    # Test Redis
    if redis_client:
        try:
            redis_client.ping()
            status_details["redis"] = "ok"
        except Exception as e:
            status_details["status"] = "unhealthy"
            status_details["redis"] = f"error: {str(e)}"
    else:
        status_details["status"] = "unhealthy"
        status_details["redis"] = "client_not_initialized"

    if status_details["status"] != "healthy":
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail=status_details
        )
        
    return status_details
