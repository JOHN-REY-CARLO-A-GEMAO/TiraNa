from fastapi import APIRouter, Depends, HTTPException, Header, Query
from sqlalchemy.orm import Session
from sqlalchemy import func
from ..database import get_db
from ..models import Payment, Booking, Review, Listing, User, SystemSetting, AdminAuditLog
from ..schemas import (
    InternalUserSync, InternalBookingSync,
    InternalReviewSync, InternalListingSync,
)
from pydantic import BaseModel
from typing import Optional, List
from decimal import Decimal
from datetime import datetime, timezone

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


# ─── Auth Dependency ────────────────────────────────────────────────

async def verify_internal_api_key(
    x_internal_api_key: Optional[str] = Header(None),
    db: Session = Depends(get_db)
):
    setting = db.query(SystemSetting).filter(SystemSetting.key == "internal_api_key").first()
    if not setting or not x_internal_api_key or x_internal_api_key != setting.value:
        raise HTTPException(status_code=403, detail="Invalid internal API key")
    return True


# ─── Payment Sync ───────────────────────────────────────────────────

@router.post("/payment-confirmed")
def payment_confirmed(
    data: InternalPaymentConfirmed,
    db: Session = Depends(get_db),
    authenticated: bool = Depends(verify_internal_api_key)
):
    # 1. Sync/Update Booking
    booking = db.query(Booking).filter(Booking.external_id == data.booking_external_id).first()
    if not booking:
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
        # Defense-in-depth: cross-check amount if booking already exists locally
        if booking.total_price and booking.total_price != data.amount:
            db.add(AdminAuditLog(
                action="AMOUNT_MISMATCH_WARNING",
                details=(
                    f"Payment {data.payment_id} amount {data.amount} {data.currency} "
                    f"differs from booking {booking.id} amount {booking.total_price}. "
                    f"Booking external_id: {data.booking_external_id}"
                ),
            ))
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


# ─── User Sync ──────────────────────────────────────────────────────

@router.post("/user-sync")
def user_sync(
    data: InternalUserSync,
    db: Session = Depends(get_db),
    authenticated: bool = Depends(verify_internal_api_key)
):
    now = datetime.now(timezone.utc)
    user = db.query(User).filter(User.external_id == data.external_id).first()

    if not user:
        user = User(
            external_id=data.external_id,
            username=data.username,
            email=data.email,
            password_hash="synced_from_client",
            is_verified=data.is_verified,
            synced_at=now,
        )
        db.add(user)
        action = "CREATE"
    else:
        user.username = data.username
        user.email = data.email
        user.is_verified = data.is_verified
        user.synced_at = now
        action = "UPDATE"

    db.add(AdminAuditLog(
        action=f"INTERNAL_USER_{action}",
        details=f"User {data.username} ({data.external_id}) synced from client backend.",
    ))

    db.commit()
    db.refresh(user)
    return {"status": "success", "message": f"User {action.lower()}d", "user_id": user.id}


# ─── Booking Sync ───────────────────────────────────────────────────

@router.post("/booking-sync")
def booking_sync(
    data: InternalBookingSync,
    db: Session = Depends(get_db),
    authenticated: bool = Depends(verify_internal_api_key)
):
    now = datetime.now(timezone.utc)
    booking = db.query(Booking).filter(Booking.external_id == data.external_id).first()

    # Resolve listing_id from external_id if provided
    listing_id = None
    if data.listing_external_id:
        listing = db.query(Listing).filter(Listing.external_id == data.listing_external_id).first()
        if listing:
            listing_id = listing.id

    if not booking:
        booking = Booking(
            external_id=data.external_id,
            listing_id=listing_id,
            listing_title=data.listing_title,
            guest_name=data.guest_name,
            guest_email=data.guest_email,
            check_in=data.check_in,
            check_out=data.check_out,
            nights=data.nights,
            total_price=data.total_price,
            status=data.status,
            synced_at=now,
        )
        db.add(booking)
        action = "CREATE"
    else:
        if listing_id:
            booking.listing_id = listing_id
        if data.listing_title:
            booking.listing_title = data.listing_title
        if data.guest_name:
            booking.guest_name = data.guest_name
        if data.guest_email:
            booking.guest_email = data.guest_email
        if data.check_in:
            booking.check_in = data.check_in
        if data.check_out:
            booking.check_out = data.check_out
        if data.nights is not None:
            booking.nights = data.nights
        if data.total_price is not None:
            booking.total_price = data.total_price
        booking.status = data.status
        booking.synced_at = now
        action = "UPDATE"

    db.add(AdminAuditLog(
        action=f"INTERNAL_BOOKING_{action}",
        details=f"Booking {data.external_id} synced from client backend. Status: {data.status}",
    ))

    db.commit()
    db.refresh(booking)
    return {"status": "success", "message": f"Booking {action.lower()}d", "booking_id": booking.id}


# ─── Review Sync ────────────────────────────────────────────────────

@router.post("/review-sync")
def review_sync(
    data: InternalReviewSync,
    db: Session = Depends(get_db),
    authenticated: bool = Depends(verify_internal_api_key)
):
    now = datetime.now(timezone.utc)
    review = db.query(Review).filter(Review.external_id == data.external_id).first()

    # Resolve listing_id from external_id if provided
    listing_id = None
    if data.listing_external_id:
        listing = db.query(Listing).filter(Listing.external_id == data.listing_external_id).first()
        if listing:
            listing_id = listing.id

    if not review:
        review = Review(
            external_id=data.external_id,
            listing_id=listing_id,
            listing_title=data.listing_title,
            guest_name=data.guest_name,
            guest_email=data.guest_email,
            rating=data.rating,
            comment=data.comment,
            is_hidden=data.is_hidden,
            synced_at=now,
        )
        db.add(review)
        action = "CREATE"
    else:
        if listing_id:
            review.listing_id = listing_id
        if data.listing_title:
            review.listing_title = data.listing_title
        if data.guest_name:
            review.guest_name = data.guest_name
        if data.guest_email:
            review.guest_email = data.guest_email
        if data.rating is not None:
            review.rating = data.rating
        if data.comment is not None:
            review.comment = data.comment
        review.is_hidden = data.is_hidden
        review.synced_at = now
        action = "UPDATE"

    db.add(AdminAuditLog(
        action=f"INTERNAL_REVIEW_{action}",
        details=f"Review {data.external_id} synced from client backend. Rating: {data.rating}",
    ))

    db.commit()
    db.refresh(review)
    return {"status": "success", "message": f"Review {action.lower()}d", "review_id": review.id}


# ─── Listing Sync ───────────────────────────────────────────────────

@router.post("/listing-sync")
def listing_sync(
    data: InternalListingSync,
    db: Session = Depends(get_db),
    authenticated: bool = Depends(verify_internal_api_key)
):
    now = datetime.now(timezone.utc)
    listing = db.query(Listing).filter(Listing.external_id == data.external_id).first()

    if not listing:
        listing = Listing(
            external_id=data.external_id,
            title=data.title,
            description=data.description,
            host_external_id=data.host_external_id,
            host_email=data.host_email,
            location=data.location,
            price_per_night=data.price_per_night,
            status=data.status,
            photo_url=data.photo_url,
            synced_at=now,
        )
        db.add(listing)
        action = "CREATE"
    else:
        listing.title = data.title
        if data.description is not None:
            listing.description = data.description
        if data.host_external_id:
            listing.host_external_id = data.host_external_id
        if data.host_email:
            listing.host_email = data.host_email
        if data.location is not None:
            listing.location = data.location
        if data.price_per_night is not None:
            listing.price_per_night = data.price_per_night
        listing.status = data.status
        if data.photo_url is not None:
            listing.photo_url = data.photo_url
        listing.synced_at = now
        action = "UPDATE"

    db.add(AdminAuditLog(
        action=f"INTERNAL_LISTING_{action}",
        details=f"Listing {data.title} ({data.external_id}) synced from client backend.",
    ))

    db.commit()
    db.refresh(listing)
    return {"status": "success", "message": f"Listing {action.lower()}d", "listing_id": listing.id}


# ─── Debug / List Endpoints ─────────────────────────────────────────

@router.get("/users")
def list_synced_users(
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=200),
    db: Session = Depends(get_db),
    authenticated: bool = Depends(verify_internal_api_key)
):
    users = db.query(User).filter(User.external_id.isnot(None)).order_by(User.synced_at.desc()).offset(skip).limit(limit).all()
    total = db.query(func.count(User.id)).filter(User.external_id.isnot(None)).scalar()
    return {
        "total": total,
        "users": [
            {
                "id": u.id, "external_id": u.external_id, "username": u.username,
                "email": u.email, "is_verified": u.is_verified,
                "synced_at": u.synced_at.isoformat() if u.synced_at else None,
            }
            for u in users
        ],
    }


@router.get("/bookings")
def list_synced_bookings(
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=200),
    db: Session = Depends(get_db),
    authenticated: bool = Depends(verify_internal_api_key)
):
    bookings = db.query(Booking).filter(Booking.external_id.isnot(None)).order_by(Booking.synced_at.desc()).offset(skip).limit(limit).all()
    total = db.query(func.count(Booking.id)).filter(Booking.external_id.isnot(None)).scalar()
    return {
        "total": total,
        "bookings": [
            {
                "id": b.id, "external_id": b.external_id, "guest_name": b.guest_name,
                "status": b.status, "total_price": float(b.total_price) if b.total_price else None,
                "synced_at": b.synced_at.isoformat() if b.synced_at else None,
            }
            for b in bookings
        ],
    }


@router.get("/reviews")
def list_synced_reviews(
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=200),
    db: Session = Depends(get_db),
    authenticated: bool = Depends(verify_internal_api_key)
):
    reviews = db.query(Review).filter(Review.external_id.isnot(None)).order_by(Review.synced_at.desc()).offset(skip).limit(limit).all()
    total = db.query(func.count(Review.id)).filter(Review.external_id.isnot(None)).scalar()
    return {
        "total": total,
        "reviews": [
            {
                "id": r.id, "external_id": r.external_id, "guest_name": r.guest_name,
                "rating": r.rating, "is_hidden": r.is_hidden,
                "synced_at": r.synced_at.isoformat() if r.synced_at else None,
            }
            for r in reviews
        ],
    }


@router.get("/listings")
def list_synced_listings(
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=200),
    db: Session = Depends(get_db),
    authenticated: bool = Depends(verify_internal_api_key)
):
    listings = db.query(Listing).filter(Listing.external_id.isnot(None)).order_by(Listing.synced_at.desc()).offset(skip).limit(limit).all()
    total = db.query(func.count(Listing.id)).filter(Listing.external_id.isnot(None)).scalar()
    return {
        "total": total,
        "listings": [
            {
                "id": l.id, "external_id": l.external_id, "title": l.title,
                "status": l.status, "price_per_night": float(l.price_per_night) if l.price_per_night else None,
                "synced_at": l.synced_at.isoformat() if l.synced_at else None,
            }
            for l in listings
        ],
    }
