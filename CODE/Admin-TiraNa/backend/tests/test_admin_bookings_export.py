import pytest
from app.models import AdminAccount, Booking
from app.middleware.admin_auth import create_admin_token
from datetime import datetime, timedelta

def test_export_bookings_success(client, db):
    # Setup admin
    admin = AdminAccount(username="exporter", email="exporter@test.com", is_active=True)
    db.add(admin)
    
    # Setup booking
    booking = Booking(
        listing_title="Test Room",
        guest_name="Guest User",
        guest_email="guest@test.com",
        check_in=datetime.utcnow(),
        check_out=datetime.utcnow() + timedelta(days=2),
        nights=2,
        total_price=1000.0,
        status="confirmed"
    )
    db.add(booking)
    db.commit()
    
    token = create_admin_token(admin)

    response = client.get(
        "/admin/bookings/export",
        headers={"Authorization": f"Bearer {token}"}
    )
    if response.status_code == 422:
        print(f"DEBUG: {response.json()}")
    assert response.status_code == 200
    assert response.headers["content-type"] == "text/csv; charset=utf-8"
    assert "attachment; filename=bookings_export.csv" in response.headers["content-disposition"]
    
    content = response.content.decode("utf-8")
    assert "Test Room" in content
    assert "Guest User" in content
