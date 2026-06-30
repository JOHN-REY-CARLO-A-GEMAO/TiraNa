from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from ..database import get_db
from ..models import AdminAccount, SupportTicket
from ..schemas import DashboardStatsResponse
from ..middleware.admin_auth import get_current_admin
from ..services.host_api_client import HostAPIClient, get_host_api_client
from ..services.client_api_client import client_api_client

router = APIRouter(prefix="/admin/dashboard", tags=["Admin Dashboard"])


@router.get("/stats", response_model=DashboardStatsResponse)
async def dashboard_stats(
    period: str = "monthly",
    db: Session = Depends(get_db),
    host_client: HostAPIClient = Depends(get_host_api_client),
    current_admin: AdminAccount = Depends(get_current_admin),
):
    open_tickets = db.query(SupportTicket).filter(SupportTicket.status == "open").count()

    # Fetch stats from Client API for user, booking, and revenue data
    client_stats = {}
    try:
        # Get user stats from Client API
        users_data = await client_api_client.get_users()
        client_stats['total_users'] = len(users_data) if users_data else 0
        # For now, set verified/unverified to 0 - these would need separate endpoints
        client_stats['verified_users'] = 0
        client_stats['unverified_users'] = client_stats['total_users']
    except Exception as e:
        print(f"Error fetching users from Client API: {e}")
        client_stats['total_users'] = 0
        client_stats['verified_users'] = 0
        client_stats['unverified_users'] = 0

    # Get booking and revenue stats from Client API
    revenue_trend = []
    booking_trend = []
    
    try:
        revenue_data = await client_api_client.get_revenue_stats()
        if revenue_data:
            revenue_trend = revenue_data.get("revenue_trend", [])
    except Exception as e:
        print(f"Error fetching revenue stats from Client API: {e}")

    try:
        revenue_trend = await client_api_client.get_revenue_trend(period)
    except Exception as e:
        print(f"Error fetching revenue trend from Client API: {e}")

    try:
        booking_trend = await client_api_client.get_booking_trend(period)
    except Exception as e:
        print(f"Error fetching booking trend from Client API: {e}")

    try:
        client_stats['total_bookings'] = await client_api_client.get_booking_count()
    except Exception as e:
        print(f"Error fetching booking count from Client API: {e}")
        client_stats['total_bookings'] = 0

    # Get host stats from Host API for active_listings and pending_withdrawals
    host_stats = {}
    try:
        host_stats = await host_client.get_stats()
    except Exception as e:
        print(f"Error fetching host stats from Host API: {e}")

    return DashboardStatsResponse(
        total_users=client_stats.get("total_users", 0),
        verified_users=client_stats.get("verified_users", 0),
        unverified_users=client_stats.get("unverified_users", 0),
        active_listings=host_stats.get("active_listings", 0),
        total_bookings=client_stats.get("total_bookings", 0),
        revenue_this_month=host_stats.get("revenue_this_month", 0),
        pending_withdrawals=host_stats.get("pending_withdrawals", 0),
        open_support_tickets=open_tickets,
        revenue_trend=revenue_trend,
        booking_trend=booking_trend
    )
