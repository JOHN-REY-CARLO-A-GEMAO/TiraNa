from fastapi import APIRouter, Depends, Query
from typing import List
from ..models import AdminAccount
from ..schemas import BookingResponse
from ..middleware.admin_auth import get_current_admin
from ..services.client_api_client import client_api_client
from ..services.host_api_client import host_api_client

router = APIRouter(prefix="/admin/bookings", tags=["Admin Bookings"])


@router.get("/", response_model=List[BookingResponse])
async def list_bookings(
    status: str = Query("", description="Filter by status"),
    search: str = Query("", description="Search by guest name/email/booking ID"),
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=100),
    current_admin: AdminAccount = Depends(get_current_admin)
):
    """Get list of all platform bookings from Client API, enriched with listing names from Host API."""
    bookings = await client_api_client.get_bookings(
        status=status, search=search, skip=skip, limit=limit
    )

    # Build a map of room_id → room name from Host API
    room_map = {}
    try:
        rooms = await host_api_client.get_rooms(skip=0, limit=1000)
        room_map = {str(r.get("id")): r.get("name") for r in rooms if r.get("id")}
    except Exception:
        pass

    # Enrich bookings with listing_title
    for b in bookings:
        if not b.get("listing_title"):
            prop_id = str(b.get("listing_id", ""))
            b["listing_title"] = room_map.get(prop_id) or f"Property #{prop_id}" if prop_id else None

    return bookings
