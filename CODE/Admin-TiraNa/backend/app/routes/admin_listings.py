from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import List, Optional
from ..database import get_db
from ..models import Listing, AdminAccount, AdminAuditLog
from ..schemas import ListingResponse, ListingActionRequest
from ..middleware.admin_auth import get_current_admin
from ..services.host_api_client import HostAPIClient, get_host_api_client
from ..services.listing_sync import sync_listings_from_host

router = APIRouter(prefix="/admin/listings", tags=["Admin Listings"])


@router.get("/", response_model=List[ListingResponse])
def list_listings(
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=200),
    status: Optional[str] = "",
    search: Optional[str] = "",
    db: Session = Depends(get_db),
    current_admin: AdminAccount = Depends(get_current_admin),
):
    query = db.query(Listing)
    if status:
        query = query.filter(Listing.status == status)
    if search:
        query = query.filter(
            Listing.title.ilike(f"%{search}%") | Listing.host_email.ilike(f"%{search}%")
        )
    return query.order_by(Listing.created_at.desc()).offset(skip).limit(limit).all()


@router.get("/count")
def count_listings(
    status: Optional[str] = "",
    search: Optional[str] = "",
    db: Session = Depends(get_db),
    current_admin: AdminAccount = Depends(get_current_admin),
):
    query = db.query(Listing)
    if status:
        query = query.filter(Listing.status == status)
    if search:
        query = query.filter(
            Listing.title.ilike(f"%{search}%") | Listing.host_email.ilike(f"%{search}%")
        )
    return {"total": query.count()}


@router.get("/{listing_id}", response_model=ListingResponse)
def get_listing(
    listing_id: int,
    db: Session = Depends(get_db),
    current_admin: AdminAccount = Depends(get_current_admin),
):
    listing = db.query(Listing).filter(Listing.id == listing_id).first()
    if not listing:
        raise HTTPException(status_code=404, detail="Listing not found")
    return listing


@router.post("/{listing_id}/approve", response_model=ListingResponse)
def approve_listing(
    listing_id: int,
    db: Session = Depends(get_db),
    current_admin: AdminAccount = Depends(get_current_admin),
):
    listing = db.query(Listing).filter(Listing.id == listing_id).first()
    if not listing:
        raise HTTPException(status_code=404, detail="Listing not found")
    listing.status = "approved"
    listing.rejection_reason = None
    db.add(AdminAuditLog(
        admin_id=current_admin.id, admin_username=current_admin.username,
        action="APPROVE_LISTING", details=f"Approved listing {listing.title} (ID: {listing.id})",
    ))
    db.commit()
    db.refresh(listing)
    return listing


@router.post("/{listing_id}/reject", response_model=ListingResponse)
def reject_listing(
    listing_id: int,
    body: ListingActionRequest,
    db: Session = Depends(get_db),
    current_admin: AdminAccount = Depends(get_current_admin),
):
    listing = db.query(Listing).filter(Listing.id == listing_id).first()
    if not listing:
        raise HTTPException(status_code=404, detail="Listing not found")
    listing.status = "rejected"
    listing.rejection_reason = body.reason
    db.add(AdminAuditLog(
        admin_id=current_admin.id, admin_username=current_admin.username,
        action="REJECT_LISTING", details=f"Rejected listing {listing.title} (ID: {listing.id}). Reason: {body.reason}",
    ))
    db.commit()
    db.refresh(listing)
    return listing


@router.post("/{listing_id}/suspend", response_model=ListingResponse)
def suspend_listing(
    listing_id: int,
    body: ListingActionRequest,
    db: Session = Depends(get_db),
    current_admin: AdminAccount = Depends(get_current_admin),
):
    listing = db.query(Listing).filter(Listing.id == listing_id).first()
    if not listing:
        raise HTTPException(status_code=404, detail="Listing not found")
    listing.status = "suspended"
    listing.rejection_reason = body.reason
    db.add(AdminAuditLog(
        admin_id=current_admin.id, admin_username=current_admin.username,
        action="SUSPEND_LISTING", details=f"Suspended listing {listing.title} (ID: {listing.id}). Reason: {body.reason}",
    ))
    db.commit()
    db.refresh(listing)
    return listing


@router.post("/sync")
async def sync_listings(
    db: Session = Depends(get_db),
    current_admin: AdminAccount = Depends(get_current_admin),
    client: HostAPIClient = Depends(get_host_api_client),
):
    """Pull latest rooms from Host API and upsert into local listings table."""
    try:
        rooms = await client.get_rooms()
    except Exception as e:
        raise HTTPException(status_code=502, detail=f"Failed to fetch rooms from Host API: {str(e)}")

    result = sync_listings_from_host(db, rooms)

    db.add(AdminAuditLog(
        admin_id=current_admin.id, admin_username=current_admin.username,
        action="MANUAL_LISTING_SYNC",
        details=f"Manual listing sync triggered. {result['created']} created, {result['updated']} updated, {result['unchanged']} unchanged.",
    ))
    db.commit()

    return {"status": "success", "message": "Listings synced from Host API", **result}
