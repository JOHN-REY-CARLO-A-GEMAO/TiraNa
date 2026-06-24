import bcrypt
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from ..database import get_db
from ..models import AdminAccount, AdminAuditLog
from ..schemas import AdminLoginRequest, AdminResponse, AdminTokenResponse
from ..middleware.admin_auth import create_admin_token, get_current_admin

router = APIRouter(prefix="/admin/auth", tags=["Admin Auth"])


@router.post("/login", response_model=AdminTokenResponse)
def admin_login(request: AdminLoginRequest, db: Session = Depends(get_db)):
    admin = db.query(AdminAccount).filter(
        (AdminAccount.username == request.username) | (AdminAccount.email == request.username)
    ).first()

    if not admin:
        raise HTTPException(status_code=401, detail="Invalid username or password")

    if not admin.is_active:
        raise HTTPException(status_code=403, detail="Admin account is deactivated")

    if not bcrypt.checkpw(request.password.encode("utf-8"), admin.password_hash.encode("utf-8")):
        raise HTTPException(status_code=401, detail="Invalid username or password")

    access_token = create_admin_token(admin)

    log = AdminAuditLog(admin_id=admin.id, admin_username=admin.username, action="admin_login", details="Admin logged in")
    db.add(log)
    db.commit()

    return AdminTokenResponse(access_token=access_token, token_type="bearer", admin=admin)


@router.get("/me", response_model=AdminResponse)
def admin_me(current_admin: AdminAccount = Depends(get_current_admin)):
    return current_admin
