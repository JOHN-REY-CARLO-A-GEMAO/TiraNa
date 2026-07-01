from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import Optional, List
from pydantic import BaseModel
from datetime import datetime

from ..database import get_db
from ..models import AdminAccount
from ..schemas import WithdrawalResponse, WithdrawalListResponse
from ..middleware.admin_auth import get_current_admin
from ..services.host_api_client import HostAPIClient, get_host_api_client

router = APIRouter(prefix="/admin/withdrawals", tags=["Admin Withdrawals"])


class WithdrawalRequest(BaseModel):
    host_id: Optional[int] = None
    amount: float
    method: str
    status: str = "pending"


@router.get("/", response_model=WithdrawalListResponse)
async def list_withdrawals(
    skip: int = 0,
    limit: int = 50,
    status: Optional[str] = None,
    db: Session = Depends(get_db),
    current_admin: AdminAccount = Depends(get_current_admin),
):
    """List all withdrawal requests from Host API."""
    # Proxy to Host API for withdrawals
    try:
        # For now, return empty list - this should be implemented via Host API
        # or a dedicated withdrawals table in Admin DB
        withdrawals = []
        total = 0
        
        return WithdrawalListResponse(
            data=withdrawals,
            total=total,
            skip=skip,
            limit=limit
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/count")
async def count_withdrawals(
    status: Optional[str] = None,
    db: Session = Depends(get_db),
    current_admin: AdminAccount = Depends(get_current_admin),
):
    """Count withdrawal requests."""
    try:
        count = 0
        return {"count": count}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/{withdrawal_id}/approve")
async def approve_withdrawal(
    withdrawal_id: str,
    db: Session = Depends(get_db),
    current_admin: AdminAccount = Depends(get_current_admin),
):
    """Approve a withdrawal request."""
    try:
        # For now, just return success - actual implementation would update Host DB
        return {"message": f"Withdrawal {withdrawal_id} approved successfully"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/{withdrawal_id}/reject")
async def reject_withdrawal(
    withdrawal_id: str,
    reason: str,
    db: Session = Depends(get_db),
    current_admin: AdminAccount = Depends(get_current_admin),
):
    """Reject a withdrawal request."""
    try:
        # For now, just return success - actual implementation would update Host DB
        return {"message": f"Withdrawal {withdrawal_id} rejected: {reason}"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
