import pytest
from app.models import User, Booking, Review, Listing, SystemSetting, AdminAuditLog
from datetime import datetime, timezone


@pytest.fixture(autouse=True)
def setup_internal_api_key(db):
    """Seed the internal API key setting for all tests in this module."""
    existing = db.query(SystemSetting).filter(SystemSetting.key == "internal_api_key").first()
    if not existing:
        db.add(SystemSetting(key="internal_api_key", value="test_secret_key_123"))
        db.commit()


def _headers(key="test_secret_key_123"):
    return {"X-Internal-API-Key": key}


# ─── Auth Tests ─────────────────────────────────────────────────────

def test_missing_api_key_returns_403(client):
    response = client.post("/admin/internal/user-sync", json={
        "external_id": "u1", "username": "test", "email": "test@test.com"
    })
    assert response.status_code == 403


def test_wrong_api_key_returns_403(client):
    response = client.post("/admin/internal/user-sync", json={
        "external_id": "u1", "username": "test", "email": "test@test.com"
    }, headers=_headers("wrong_key"))
    assert response.status_code == 403


# ─── User Sync Tests ────────────────────────────────────────────────

def test_user_sync_creates_new_user(client, db):
    response = client.post("/admin/internal/user-sync", json={
        "external_id": "client-uuid-001",
        "username": "john_doe",
        "email": "john@example.com",
        "is_verified": True,
        "first_name": "John",
        "last_name": "Doe",
    }, headers=_headers())
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "success"
    assert data["message"] == "User created"

    user = db.query(User).filter(User.external_id == "client-uuid-001").first()
    assert user is not None
    assert user.username == "john_doe"
    assert user.email == "john@example.com"
    assert user.is_verified is True
    assert user.synced_at is not None


def test_user_sync_updates_existing_user(client, db):
    # Create initial user
    user = User(
        external_id="client-uuid-002", username="old_name",
        email="old@test.com", password_hash="synced", is_verified=False
    )
    db.add(user)
    db.commit()

    # Sync with updated data
    response = client.post("/admin/internal/user-sync", json={
        "external_id": "client-uuid-002",
        "username": "new_name",
        "email": "new@test.com",
        "is_verified": True,
    }, headers=_headers())
    assert response.status_code == 200

    db.refresh(user)
    assert user.username == "new_name"
    assert user.email == "new@test.com"
    assert user.is_verified is True


def test_user_sync_creates_audit_log(client, db):
    client.post("/admin/internal/user-sync", json={
        "external_id": "u1", "username": "test", "email": "t@t.com"
    }, headers=_headers())

    log = db.query(AdminAuditLog).filter(
        AdminAuditLog.action == "INTERNAL_USER_CREATE"
    ).first()
    assert log is not None
    assert "client-uuid" in log.details or "test" in log.details


# ─── Booking Sync Tests ─────────────────────────────────────────────

def test_booking_sync_creates_new_booking(client, db):
    response = client.post("/admin/internal/booking-sync", json={
        "external_id": "booking-uuid-001",
        "guest_name": "Jane Doe",
        "guest_email": "jane@example.com",
        "total_price": 5000.00,
        "status": "confirmed",
    }, headers=_headers())
    assert response.status_code == 200
    assert response.json()["message"] == "Booking created"

    booking = db.query(Booking).filter(Booking.external_id == "booking-uuid-001").first()
    assert booking is not None
    assert booking.guest_name == "Jane Doe"
    assert float(booking.total_price) == 5000.00
    assert booking.synced_at is not None


def test_booking_sync_updates_existing_booking(client, db):
    booking = Booking(
        external_id="booking-uuid-002", guest_name="Old Name",
        status="pending", total_price=1000
    )
    db.add(booking)
    db.commit()

    response = client.post("/admin/internal/booking-sync", json={
        "external_id": "booking-uuid-002",
        "guest_name": "Updated Name",
        "status": "confirmed",
        "total_price": 2000.00,
    }, headers=_headers())
    assert response.status_code == 200

    db.refresh(booking)
    assert booking.guest_name == "Updated Name"
    assert booking.status == "confirmed"
    assert float(booking.total_price) == 2000.00


def test_booking_sync_resolves_listing(client, db):
    listing = Listing(external_id="prop-001", title="Beach House", status="approved")
    db.add(listing)
    db.commit()

    response = client.post("/admin/internal/booking-sync", json={
        "external_id": "booking-uuid-003",
        "listing_external_id": "prop-001",
        "listing_title": "Beach House",
        "status": "confirmed",
    }, headers=_headers())
    assert response.status_code == 200

    booking = db.query(Booking).filter(Booking.external_id == "booking-uuid-003").first()
    assert booking.listing_id == listing.id


# ─── Review Sync Tests ──────────────────────────────────────────────

def test_review_sync_creates_new_review(client, db):
    response = client.post("/admin/internal/review-sync", json={
        "external_id": "review-uuid-001",
        "guest_name": "Happy Guest",
        "rating": 5,
        "comment": "Amazing stay!",
    }, headers=_headers())
    assert response.status_code == 200
    assert response.json()["message"] == "Review created"

    review = db.query(Review).filter(Review.external_id == "review-uuid-001").first()
    assert review is not None
    assert review.rating == 5
    assert review.comment == "Amazing stay!"


def test_review_sync_updates_existing_review(client, db):
    review = Review(
        external_id="review-uuid-002", guest_name="Guest",
        rating=3, comment="Okay"
    )
    db.add(review)
    db.commit()

    response = client.post("/admin/internal/review-sync", json={
        "external_id": "review-uuid-002",
        "rating": 4,
        "comment": "Actually quite good!",
    }, headers=_headers())
    assert response.status_code == 200

    db.refresh(review)
    assert review.rating == 4
    assert review.comment == "Actually quite good!"


# ─── Listing Sync Tests ─────────────────────────────────────────────

def test_listing_sync_creates_new_listing(client, db):
    response = client.post("/admin/internal/listing-sync", json={
        "external_id": "prop-100",
        "title": "Mountain View",
        "price_per_night": 3500.00,
        "status": "approved",
    }, headers=_headers())
    assert response.status_code == 200

    listing = db.query(Listing).filter(Listing.external_id == "prop-100").first()
    assert listing is not None
    assert listing.title == "Mountain View"
    assert float(listing.price_per_night) == 3500.00


def test_listing_sync_updates_existing_listing(client, db):
    listing = Listing(external_id="prop-101", title="Old Title", status="pending")
    db.add(listing)
    db.commit()

    response = client.post("/admin/internal/listing-sync", json={
        "external_id": "prop-101",
        "title": "New Title",
        "status": "approved",
    }, headers=_headers())
    assert response.status_code == 200

    db.refresh(listing)
    assert listing.title == "New Title"
    assert listing.status == "approved"


# ─── Amount Mismatch Audit Test ─────────────────────────────────────

def test_payment_sync_logs_amount_mismatch(client, db):
    booking = Booking(
        external_id="booking-mismatch-001", total_price=1000,
        status="pending"
    )
    db.add(booking)
    db.commit()

    response = client.post("/admin/internal/payment-confirmed", json={
        "booking_external_id": "booking-mismatch-001",
        "payment_id": "pay-001",
        "amount": 1500.00,
        "currency": "PHP",
        "payment_method": "gcash",
        "payer_name": "Test",
        "payer_email": "test@test.com",
    }, headers=_headers())
    assert response.status_code == 200

    log = db.query(AdminAuditLog).filter(
        AdminAuditLog.action == "AMOUNT_MISMATCH_WARNING"
    ).first()
    assert log is not None
    assert "1500" in log.details
    assert "1000" in log.details
