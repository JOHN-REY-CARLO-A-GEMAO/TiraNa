from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import List, Optional
from ..database import get_db
from ..models import Withdrawal, AdminAccount, AdminAuditLog
from ..schemas import WithdrawalResponse, WithdrawalActionRequest
from ..middleware.admin_auth import get_current_admin

router = APIRouter(prefix="/admin/withdrawals", tags=["Admin Withdrawals"])


@router.get("/", response_model=List[WithdrawalResponse])
def list_withdrawals(
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=200),
    status: Optional[str] = "",
    db: Session = Depends(get_db),
    current_admin: AdminAccount = Depends(get_current_admin),
):
    query = db.query(Withdrawal)
    if status:
        query = query.filter(Withdrawal.status == status)
    return query.order_by(Withdrawal.created_at.desc()).offset(skip).limit(limit).all()


@router.get("/count")
def count_withdrawals(
    status: Optional[str] = "",
    db: Session = Depends(get_db),
    current_admin: AdminAccount = Depends(get_current_admin),
):
    query = db.query(Withdrawal)
    if status:
        query = query.filter(Withdrawal.status == status)
    return {"total": query.count()}


@router.get("/{withdrawal_id}", response_model=WithdrawalResponse)
def get_withdrawal(
    withdrawal_id: int,
    db: Session = Depends(get_db),
    current_admin: AdminAccount = Depends(get_current_admin),
):
    w = db.query(Withdrawal).filter(Withdrawal.id == withdrawal_id).first()
    if not w:
        raise HTTPException(status_code=404, detail="Withdrawal not found")
    return w


@router.post("/{withdrawal_id}/approve", response_model=WithdrawalResponse)
def approve_withdrawal(
    withdrawal_id: int,
    db: Session = Depends(get_db),
    current_admin: AdminAccount = Depends(get_current_admin),
):
    w = db.query(Withdrawal).filter(Withdrawal.id == withdrawal_id).first()
    if not w:
        raise HTTPException(status_code=404, detail="Withdrawal not found")
    w.status = "approved"
    db.add(AdminAuditLog(
        admin_id=current_admin.id, admin_username=current_admin.username,
        action="APPROVE_WITHDRAWAL", details=f"Approved withdrawal {w.id} ({w.amount}) for host {w.host_name}",
    ))
    db.commit()
    db.refresh(w)
    return w


@router.post("/{withdrawal_id}/reject", response_model=WithdrawalResponse)
def reject_withdrawal(
    withdrawal_id: int,
    body: WithdrawalActionRequest,
    db: Session = Depends(get_db),
    current_admin: AdminAccount = Depends(get_current_admin),
):
    w = db.query(Withdrawal).filter(Withdrawal.id == withdrawal_id).first()
    if not w:
        raise HTTPException(status_code=404, detail="Withdrawal not found")
    w.status = "rejected"
    w.rejection_reason = body.reason
    db.add(AdminAuditLog(
        admin_id=current_admin.id, admin_username=current_admin.username,
        action="REJECT_WITHDRAWAL", details=f"Rejected withdrawal {w.id} ({w.amount}) for host {w.host_name}. Reason: {body.reason}",
    ))
    db.commit()
    db.refresh(w)
    return w
