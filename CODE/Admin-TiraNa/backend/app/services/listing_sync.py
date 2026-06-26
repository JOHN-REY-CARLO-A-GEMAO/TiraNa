import logging
from datetime import datetime, timezone
from typing import List, Dict, Any
from sqlalchemy.orm import Session
from ..models import Listing, AdminAuditLog

logger = logging.getLogger(__name__)


def sync_listings_from_host(db: Session, rooms: List[Dict[str, Any]]) -> Dict[str, int]:
    """Upsert a list of Host API room records into the local listings table.

    Returns a summary dict with counts of created, updated, and unchanged records.
    """
    now = datetime.now(timezone.utc)
    created = 0
    updated = 0
    unchanged = 0

    for room in rooms:
        external_id = str(room.get("id", ""))
        if not external_id:
            continue

        title = room.get("title") or room.get("name") or "Untitled"
        description = room.get("description") or ""
        host_external_id = str(room.get("host_id", "")) if room.get("host_id") else None
        host_email = room.get("host_email")
        location = _build_location(room)
        price_per_night = room.get("base_price") or room.get("price_per_night")
        status = _map_status(room.get("status", "active"))
        photo_url = _extract_photo_url(room)

        listing = db.query(Listing).filter(Listing.external_id == external_id).first()

        if not listing:
            listing = Listing(
                external_id=external_id,
                title=title,
                description=description,
                host_external_id=host_external_id,
                host_email=host_email,
                location=location,
                price_per_night=price_per_night,
                status=status,
                photo_url=photo_url,
                synced_at=now,
            )
            db.add(listing)
            created += 1
        else:
            changed = False
            if listing.title != title:
                listing.title = title
                changed = True
            if listing.description != description:
                listing.description = description
                changed = True
            if listing.host_external_id != host_external_id:
                listing.host_external_id = host_external_id
                changed = True
            if listing.host_email != host_email:
                listing.host_email = host_email
                changed = True
            if listing.location != location:
                listing.location = location
                changed = True
            if listing.price_per_night != price_per_night:
                listing.price_per_night = price_per_night
                changed = True
            if listing.status != status:
                listing.status = status
                changed = True
            if listing.photo_url != photo_url:
                listing.photo_url = photo_url
                changed = True

            if changed:
                listing.synced_at = now
                updated += 1
            else:
                unchanged += 1

    db.add(AdminAuditLog(
        action="LISTING_PULL_SYNC",
        details=f"Synced {len(rooms)} rooms from Host API: {created} created, {updated} updated, {unchanged} unchanged.",
    ))
    db.commit()

    return {"created": created, "updated": updated, "unchanged": unchanged, "total": len(rooms)}


def _build_location(room: Dict[str, Any]) -> str:
    """Build a single location string from room data."""
    parts = []
    for key in ("street", "city", "province", "region", "country"):
        val = room.get(key) or (room.get("location", {}) or {}).get(key)
        if val:
            parts.append(str(val))
    if parts:
        return ", ".join(parts)
    return room.get("location") or ""


def _extract_photo_url(room: Dict[str, Any]) -> str:
    """Extract the primary photo URL from room data."""
    images = room.get("images") or room.get("photos") or []
    if images and isinstance(images, list) and len(images) > 0:
        first = images[0]
        if isinstance(first, dict):
            return first.get("url") or first.get("image_url") or ""
        return str(first)
    return room.get("photo_url") or room.get("image_url") or ""


def _map_status(host_status: str) -> str:
    """Map Host API room status to Admin listing status."""
    mapping = {
        "active": "approved",
        "approved": "approved",
        "pending": "pending",
        "inactive": "suspended",
        "suspended": "suspended",
        "rejected": "rejected",
    }
    return mapping.get(host_status, "approved")
