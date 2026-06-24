from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import List, Optional
from ..database import get_db
from ..models import User, AdminAccount, AdminAuditLog
from ..schemas import UserResponse
from ..middleware.admin_auth import get_current_admin

router = APIRouter(prefix="/admin/users", tags=["Admin Users"])


@router.get("/", response_model=List[UserResponse])
def list_users(
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=200),
    search: Optional[str] = "",
    db: Session = Depends(get_db),
    current_admin: AdminAccount = Depends(get_current_admin),
):
    query = db.query(User)
    if search:
        query = query.filter(
            User.username.ilike(f"%{search}%") | User.email.ilike(f"%{search}%")
        )
    users = query.order_by(User.created_at.desc()).offset(skip).limit(limit).all()
    return users


@router.get("/count")
def count_users(
    search: Optional[str] = "",
    db: Session = Depends(get_db),
    current_admin: AdminAccount = Depends(get_current_admin),
):
    query = db.query(User)
    if search:
        query = query.filter(
            User.username.ilike(f"%{search}%") | User.email.ilike(f"%{search}%")
        )
    return {"total": query.count()}


@router.delete("/{user_id}")
def delete_user(
    user_id: int,
    db: Session = Depends(get_db),
    current_admin: AdminAccount = Depends(get_current_admin),
):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    db.delete(user)

    log = AdminAuditLog(
        admin_id=current_admin.id,
        admin_username=current_admin.username,
        action="DELETE_USER",
        details=f"Deleted user {user.username} (ID: {user.id}, Email: {user.email})",
    )
    db.add(log)
    db.commit()

    return {"message": "User deleted successfully"}
