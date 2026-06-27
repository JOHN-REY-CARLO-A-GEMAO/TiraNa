from pydantic import BaseModel
from datetime import datetime
from typing import Optional, List
from decimal import Decimal


# ── Auth Schemas ──

class SignupRequest(BaseModel):
    username: str
    email: str
    password: str


class VerifyRequest(BaseModel):
    email: str
    code: str


class SigninRequest(BaseModel):
    email_or_username: str
    password: str


class TokenResponse(BaseModel):
    access_token: str
    token_type: str


# ── Admin Auth Schemas ──

class AdminLoginRequest(BaseModel):
    username: str
    password: str


class AdminResponse(BaseModel):
    id: int
    username: str
    email: str
    is_active: bool
    password_changed: bool
    created_at: datetime
    class Config:
        from_attributes = True


class AdminTokenResponse(BaseModel):
    access_token: str
    token_type: str
    admin: Optional[AdminResponse] = None
    requires_otp: bool = False
    temp_token: Optional[str] = None


class VerifyOTPRequest(BaseModel):
    email: str
    code: str
    temp_token: str


class ChangePasswordRequest(BaseModel):
    current_password: str
    new_password: str


class AdminCreateRequest(BaseModel):
    username: str
    email: str
    password: str


class AdminRegisterRequest(BaseModel):
    username: str
    email: str
    password: str


class AdminRegisterVerifyRequest(BaseModel):
    email: str
    code: str


class AdminUpdateRequest(BaseModel):
    email: Optional[str] = None
    is_active: Optional[bool] = None


class AdminInviteRequest(BaseModel):
    username: str
    email: str


class AdminAcceptInviteRequest(BaseModel):
    email: str
    code: str
    password: str


# ── Dashboard Stats ──

class DashboardStatsResponse(BaseModel):
    total_users: int = 0
    verified_users: int = 0
    unverified_users: int = 0
    active_listings: Optional[int] = 0
    total_bookings: Optional[int] = 0
    revenue_this_month: Optional[Decimal] = 0
    pending_withdrawals: Optional[int] = 0
    open_support_tickets: Optional[int] = 0
    revenue_trend: Optional[List[dict]] = []
    booking_trend: Optional[List[dict]] = []


class AdminAuditLogResponse(BaseModel):
    id: int
    admin_id: Optional[int] = None
    admin_username: Optional[str] = None
    action: str
    details: Optional[str] = None
    created_at: datetime
    class Config:
        from_attributes = True


# ── Support Ticket Schemas ──

class TicketCreateRequest(BaseModel):
    subject: str
    description: str
    requester_name: Optional[str] = None
    requester_email: Optional[str] = None
    category: str = "general"
    priority: str = "medium"


class TicketUpdateRequest(BaseModel):
    status: Optional[str] = None
    assigned_to: Optional[str] = None
    priority: Optional[str] = None
    resolution: Optional[str] = None


class TicketResponse(BaseModel):
    id: int
    subject: str
    description: str
    requester_name: Optional[str] = None
    requester_email: Optional[str] = None
    category: str
    priority: str
    status: str
    assigned_to: Optional[str] = None
    resolution: Optional[str] = None
    created_at: datetime
    updated_at: Optional[datetime] = None
    class Config:
        from_attributes = True


# ── Dispute Schemas ──

class DisputeCreateRequest(BaseModel):
    booking_external_id: Optional[str] = None
    filed_by: str
    filed_by_email: Optional[str] = None
    reason: str
    evidence: Optional[str] = None


class DisputeUpdateRequest(BaseModel):
    status: Optional[str] = None
    resolution: Optional[str] = None
    resolved_by: Optional[str] = None


class DisputeResponse(BaseModel):
    id: int
    booking_external_id: Optional[str] = None
    filed_by: Optional[str] = None
    filed_by_email: Optional[str] = None
    reason: str
    evidence: Optional[str] = None
    status: str
    resolution: Optional[str] = None
    resolved_by: Optional[str] = None
    created_at: datetime
    updated_at: Optional[datetime] = None
    class Config:
        from_attributes = True


# ── System Settings Schemas ──

class SettingResponse(BaseModel):
    id: int
    key: str
    value: Optional[str] = None
    description: Optional[str] = None
    updated_at: Optional[datetime] = None
    class Config:
        from_attributes = True


class SettingUpdateRequest(BaseModel):
    value: str
    description: Optional[str] = None
