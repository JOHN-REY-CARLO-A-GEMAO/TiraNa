from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import List, Optional
from ..database import get_db
from ..models import Review, AdminAccount, AdminAuditLog
from ..schemas import ReviewResponse
from ..middleware.admin_auth import get_current_admin

router = APIRouter(prefix="/admin/reviews", tags=["Admin Reviews"])


@router.get("/", response_model=List[ReviewResponse])
def list_reviews(
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=200),
    search: Optional[str] = "",
    db: Session = Depends(get_db),
    current_admin: AdminAccount = Depends(get_current_admin),
):
    query = db.query(Review)
    if search:
        query = query.filter(
            Review.listing_title.ilike(f"%{search}%") |
            Review.guest_name.ilike(f"%{search}%") |
            Review.comment.ilike(f"%{search}%")
        )
    return query.order_by(Review.created_at.desc()).offset(skip).limit(limit).all()


@router.get("/count")
def count_reviews(
    search: Optional[str] = "",
    db: Session = Depends(get_db),
    current_admin: AdminAccount = Depends(get_current_admin),
):
    query = db.query(Review)
    if search:
        query = query.filter(
            Review.listing_title.ilike(f"%{search}%") |
            Review.guest_name.ilike(f"%{search}%")
        )
    return {"total": query.count()}


@router.get("/{review_id}", response_model=ReviewResponse)
def get_review(
    review_id: int,
    db: Session = Depends(get_db),
    current_admin: AdminAccount = Depends(get_current_admin),
):
    review = db.query(Review).filter(Review.id == review_id).first()
    if not review:
        raise HTTPException(status_code=404, detail="Review not found")
    return review


@router.post("/{review_id}/hide", response_model=ReviewResponse)
def hide_review(
    review_id: int,
    db: Session = Depends(get_db),
    current_admin: AdminAccount = Depends(get_current_admin),
):
    review = db.query(Review).filter(Review.id == review_id).first()
    if not review:
        raise HTTPException(status_code=404, detail="Review not found")
    review.is_hidden = True
    db.add(AdminAuditLog(
        admin_id=current_admin.id, admin_username=current_admin.username,
        action="HIDE_REVIEW", details=f"Hidden review {review.id} by {review.guest_name}",
    ))
    db.commit()
    db.refresh(review)
    return review


@router.post("/{review_id}/show", response_model=ReviewResponse)
def show_review(
    review_id: int,
    db: Session = Depends(get_db),
    current_admin: AdminAccount = Depends(get_current_admin),
):
    review = db.query(Review).filter(Review.id == review_id).first()
    if not review:
        raise HTTPException(status_code=404, detail="Review not found")
    review.is_hidden = False
    db.add(AdminAuditLog(
        admin_id=current_admin.id, admin_username=current_admin.username,
        action="SHOW_REVIEW", details=f"Unhidden review {review.id} by {review.guest_name}",
    ))
    db.commit()
    db.refresh(review)
    return review
