from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import List, Optional
from decimal import Decimal
from ..database import get_db
from ..models import Payment, AdminAccount, AdminAuditLog
from ..schemas import PaymentResponse, RefundRequest
from ..middleware.admin_auth import get_current_admin

router = APIRouter(prefix="/admin/payments", tags=["Admin Payments"])


@router.get("/", response_model=List[PaymentResponse])
def list_payments(
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=200),
    status: Optional[str] = "",
    search: Optional[str] = "",
    db: Session = Depends(get_db),
    current_admin: AdminAccount = Depends(get_current_admin),
):
    query = db.query(Payment)
    if status:
        query = query.filter(Payment.status == status)
    if search:
        query = query.filter(
            Payment.payer_name.ilike(f"%{search}%") |
            Payment.booking_external_id.ilike(f"%{search}%") |
            Payment.payer_email.ilike(f"%{search}%")
        )
    return query.order_by(Payment.created_at.desc()).offset(skip).limit(limit).all()


@router.get("/count")
def count_payments(
    status: Optional[str] = "",
    db: Session = Depends(get_db),
    current_admin: AdminAccount = Depends(get_current_admin),
):
    query = db.query(Payment)
    if status:
        query = query.filter(Payment.status == status)
    return {"total": query.count()}


@router.get("/revenue")
def revenue_stats(
    db: Session = Depends(get_db),
    current_admin: AdminAccount = Depends(get_current_admin),
):
    from sqlalchemy import func
    total = db.query(func.coalesce(func.sum(Payment.amount), 0)).filter(
        Payment.status == "completed"
    ).scalar()
    refunded = db.query(func.coalesce(func.sum(Payment.refund_amount), 0)).filter(
        Payment.refund_amount.isnot(None)
    ).scalar()
    return {"total_revenue": float(total), "total_refunded": float(refunded)}


@router.get("/{payment_id}", response_model=PaymentResponse)
def get_payment(
    payment_id: int,
    db: Session = Depends(get_db),
    current_admin: AdminAccount = Depends(get_current_admin),
):
    payment = db.query(Payment).filter(Payment.id == payment_id).first()
    if not payment:
        raise HTTPException(status_code=404, detail="Payment not found")
    return payment


@router.post("/{payment_id}/refund", response_model=PaymentResponse)
def refund_payment(
    payment_id: int,
    body: RefundRequest,
    db: Session = Depends(get_db),
    current_admin: AdminAccount = Depends(get_current_admin),
):
    payment = db.query(Payment).filter(Payment.id == payment_id).first()
    if not payment:
        raise HTTPException(status_code=404, detail="Payment not found")
    if payment.status == "refunded":
        raise HTTPException(status_code=400, detail="Payment already refunded")
    if body.amount > payment.amount:
        raise HTTPException(status_code=400, detail="Refund amount exceeds payment amount")
    payment.status = "refunded"
    payment.refund_amount = body.amount
    payment.refund_reason = body.reason
    db.add(AdminAuditLog(
        admin_id=current_admin.id, admin_username=current_admin.username,
        action="REFUND_PAYMENT", details=f"Refunded {body.amount} {payment.currency} for payment {payment.id}. Reason: {body.reason}",
    ))
    db.commit()
    db.refresh(payment)
    return payment
