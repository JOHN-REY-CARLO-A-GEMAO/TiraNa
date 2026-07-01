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
        # Count verified/unverified from Client users
        verified = sum(1 for u in (users_data or []) if u.get('is_verified'))
        client_stats['verified_users'] = verified
        client_stats['unverified_users'] = client_stats['total_users'] - verified
    except Exception as e:
        print(f"Error fetching users from Client API: {e}")
        client_stats['total_users'] = 0
        client_stats['verified_users'] = 0
        client_stats['unverified_users'] = 0

    # Get host stats from Host API and count verified hosts
    host_stats = {}
    try:
        host_data = await host_client.get_hosts()
        host_users = host_data.get("users", []) if isinstance(host_data, dict) else []
        host_verified = sum(1 for h in host_users if h.get('is_verified'))
        client_stats['verified_users'] += host_verified
        client_stats['unverified_users'] += len(host_users) - host_verified
        client_stats['total_users'] += len(host_users)
    except Exception as e:
        print(f"Error fetching hosts from Host API: {e}")
    revenue_trend = []
    booking_trend = []
    
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
    try:
        host_api_stats = await host_client.get_stats()
        host_stats.update(host_api_stats)
    except Exception as e:
        print(f"Error fetching host stats from Host API: {e}")

    # Get revenue totals from Client API
    revenue_data = {}
    try:
        revenue_data = await client_api_client.get_revenue_stats()
    except Exception as e:
        print(f"Error fetching revenue data from Client API: {e}")

    return DashboardStatsResponse(
        total_users=client_stats.get("total_users", 0),
        verified_users=client_stats.get("verified_users", 0),
        unverified_users=client_stats.get("unverified_users", 0),
        active_listings=host_stats.get("active_listings", 0),
        total_bookings=client_stats.get("total_bookings", 0),
        revenue_this_month=revenue_data.get("total_revenue", 0) if revenue_data else 0,
        pending_withdrawals=host_stats.get("pending_withdrawals", 0),
        open_support_tickets=open_tickets,
        revenue_trend=revenue_trend,
        booking_trend=booking_trend
    )
