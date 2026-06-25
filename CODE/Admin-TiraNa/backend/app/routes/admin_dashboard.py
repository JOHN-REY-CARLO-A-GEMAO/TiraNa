from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from ..database import get_db
from ..models import User, AdminAccount, SupportTicket
from ..schemas import DashboardStatsResponse
from ..middleware.admin_auth import get_current_admin
from ..services.host_api_client import HostAPIClient, get_host_api_client

router = APIRouter(prefix="/admin/dashboard", tags=["Admin Dashboard"])


@router.get("/stats", response_model=DashboardStatsResponse)
async def dashboard_stats(
    db: Session = Depends(get_db),
    client: HostAPIClient = Depends(get_host_api_client),
    current_admin: AdminAccount = Depends(get_current_admin),
):
    total_users = db.query(User).count()
    verified_users = db.query(User).filter(User.is_verified.is_(True)).count()
    unverified_users = total_users - verified_users
    
    open_tickets = db.query(SupportTicket).filter(SupportTicket.status == "open").count()

    host_stats = {}
    try:
        host_stats = await client.get_stats()
    except Exception as e:
        print(f"Error fetching stats from Host API: {e}")
        # Fallback values if Host API is down or doesn't have aggregate endpoint
        pass

    return DashboardStatsResponse(
        total_users=total_users,
        verified_users=verified_users,
        unverified_users=unverified_users,
        active_listings=host_stats.get("active_listings", 0),
        total_bookings=host_stats.get("total_bookings", 0),
        revenue_this_month=host_stats.get("revenue_this_month", 0),
        pending_withdrawals=host_stats.get("pending_withdrawals", 0),
        open_support_tickets=open_tickets
    )
