from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from ..database import get_db
from ..models import User, AdminAccount
from ..schemas import DashboardStatsResponse
from ..middleware.admin_auth import get_current_admin

router = APIRouter(prefix="/admin/dashboard", tags=["Admin Dashboard"])


@router.get("/stats", response_model=DashboardStatsResponse)
def dashboard_stats(
    db: Session = Depends(get_db),
    current_admin: AdminAccount = Depends(get_current_admin),
):
    total_users = db.query(User).count()
    verified_users = db.query(User).filter(User.is_verified.is_(True)).count()
    unverified_users = total_users - verified_users

    return DashboardStatsResponse(
        total_users=total_users,
        verified_users=verified_users,
        unverified_users=unverified_users,
    )
