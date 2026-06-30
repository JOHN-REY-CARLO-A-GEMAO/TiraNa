from fastapi import Header, HTTPException, status
from ..config import get_settings

settings = get_settings()

async def verify_internal_api_key(x_internal_api_key: str = Header(None)):
    if not x_internal_api_key or x_internal_api_key != settings.INTERNAL_API_KEY:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or missing Internal API Key"
        )
