from fastapi import APIRouter, Depends, HTTPException, Header, Request
from sqlalchemy.orm import Session
from ..database import get_db
from ..models import Payment, Booking, SystemSetting, AdminAuditLog
from pydantic import BaseModel
from typing import Optional
from decimal import Decimal

router = APIRouter(prefix="/admin/internal", tags=["Internal API"])

class InternalPaymentConfirmed(BaseModel):
    booking_external_id: str
    payment_id: str
    amount: Decimal
    currency: str = "PHP"
    payment_method: str
    payer_name: str
    payer_email: str
    status: str = "paid"

async def verify_internal_api_key(
    x_internal_api_key: Optional[str] = Header(None),
    db: Session = Depends(get_db)
):
    setting = db.query(SystemSetting).filter(SystemSetting.key == "internal_api_key").first()
    if not setting or not x_internal_api_key or x_internal_api_key != setting.value:
        raise HTTPException(status_code=403, detail="Invalid internal API key")
    return True

@router.post("/payment-confirmed")
def payment_confirmed(
    data: InternalPaymentConfirmed,
    db: Session = Depends(get_db),
    authenticated: bool = Depends(verify_internal_api_key)
):
    # 1. Sync/Update Booking
    booking = db.query(Booking).filter(Booking.external_id == data.booking_external_id).first()
    if not booking:
        # Create a shell booking record if it doesn't exist in Admin DB yet
        booking = Booking(
            external_id=data.booking_external_id,
            status="confirmed",
            total_price=data.amount,
            guest_name=data.payer_name,
            guest_email=data.payer_email
        )
        db.add(booking)
        db.flush()
    else:
        booking.status = "confirmed"

    # 2. Create Payment record
    payment = db.query(Payment).filter(Payment.external_id == data.payment_id).first()
    if not payment:
        payment = Payment(
            external_id=data.payment_id,
            booking_id=booking.id,
            booking_external_id=data.booking_external_id,
            payer_name=data.payer_name,
            payer_email=data.payer_email,
            amount=data.amount,
            currency=data.currency,
            method=data.payment_method,
            status="completed" if data.status == "paid" else data.status
        )
        db.add(payment)
    
    db.add(AdminAuditLog(
        action="INTERNAL_PAYMENT_SYNC",
        details=f"Payment {data.payment_id} for booking {data.booking_external_id} synced from client backend."
    ))
    
    db.commit()
    return {"status": "success", "message": "Payment synced successfully"}
