from fastapi import APIRouter, Depends, HTTPException, Query
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session
from typing import List, Optional
import csv
import io
from ..database import get_db
from ..models import Booking, AdminAccount, AdminAuditLog
from ..schemas import BookingResponse, BookingCancelRequest
from ..middleware.admin_auth import get_current_admin

router = APIRouter(prefix="/admin/bookings", tags=["Admin Bookings"])


@router.get("/", response_model=List[BookingResponse])
def list_bookings(
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=200),
    status: Optional[str] = "",
    search: Optional[str] = "",
    db: Session = Depends(get_db),
    current_admin: AdminAccount = Depends(get_current_admin),
):
    query = db.query(Booking)
    if status:
        query = query.filter(Booking.status == status)
    if search:
        query = query.filter(
            Booking.guest_name.ilike(f"%{search}%") |
            Booking.listing_title.ilike(f"%{search}%") |
            Booking.guest_email.ilike(f"%{search}%")
        )
    return query.order_by(Booking.created_at.desc()).offset(skip).limit(limit).all()


@router.get("/count")
def count_bookings(
    status: Optional[str] = "",
    search: Optional[str] = "",
    db: Session = Depends(get_db),
    current_admin: AdminAccount = Depends(get_current_admin),
):
    query = db.query(Booking)
    if status:
        query = query.filter(Booking.status == status)
    if search:
        query = query.filter(
            Booking.guest_name.ilike(f"%{search}%") |
            Booking.listing_title.ilike(f"%{search}%")
        )
    return {"total": query.count()}


@router.get("/id/{booking_id}", response_model=BookingResponse)
def get_booking(
    booking_id: int,
    db: Session = Depends(get_db),
    current_admin: AdminAccount = Depends(get_current_admin),
):
    booking = db.query(Booking).filter(Booking.id == booking_id).first()
    if not booking:
        raise HTTPException(status_code=404, detail="Booking not found")
    return booking


@router.get("/export")
def export_bookings(
    status: Optional[str] = None,
    search: Optional[str] = None,
    db: Session = Depends(get_db),
    current_admin: AdminAccount = Depends(get_current_admin),
):
    query = db.query(Booking)
    if status:
        query = query.filter(Booking.status == status)
    if search:
        query = query.filter(
            Booking.guest_name.ilike(f"%{search}%") |
            Booking.listing_title.ilike(f"%{search}%") |
            Booking.guest_email.ilike(f"%{search}%")
        )
    
    bookings = query.order_by(Booking.created_at.desc()).all()
    
    output = io.StringIO()
    writer = csv.writer(output)
    
    # Headers
    writer.writerow([
        "ID", "Listing", "Guest Name", "Guest Email", 
        "Check In", "Check Out", "Nights", "Total Price", 
        "Status", "Created At"
    ])
    
    for b in bookings:
        writer.writerow([
            b.id, b.listing_title, b.guest_name, b.guest_email,
            b.check_in.strftime("%Y-%m-%d") if b.check_in else "",
            b.check_out.strftime("%Y-%m-%d") if b.check_out else "",
            b.nights, float(b.total_price) if b.total_price else 0,
            b.status, b.created_at.strftime("%Y-%m-%d %H:%M:%S")
        ])
    
    output.seek(0)
    
    db.add(AdminAuditLog(
        admin_id=current_admin.id, admin_username=current_admin.username,
        action="EXPORT_BOOKINGS", details=f"Exported {len(bookings)} bookings to CSV",
    ))
    db.commit()

    return StreamingResponse(
        iter([output.getvalue()]),
        media_type="text/csv",
        headers={"Content-Disposition": "attachment; filename=bookings_export.csv"}
    )


@router.post("/{booking_id}/cancel", response_model=BookingResponse)
def cancel_booking(
    booking_id: int,
    body: BookingCancelRequest,
    db: Session = Depends(get_db),
    current_admin: AdminAccount = Depends(get_current_admin),
):
    booking = db.query(Booking).filter(Booking.id == booking_id).first()
    if not booking:
        raise HTTPException(status_code=404, detail="Booking not found")
    if booking.status == "cancelled":
        raise HTTPException(status_code=400, detail="Booking already cancelled")
    booking.status = "cancelled"
    booking.cancellation_reason = body.reason
    db.add(AdminAuditLog(
        admin_id=current_admin.id, admin_username=current_admin.username,
        action="CANCEL_BOOKING", details=f"Cancelled booking {booking.id} ({booking.listing_title}). Reason: {body.reason}",
    ))
    db.commit()
    db.refresh(booking)
    return booking
