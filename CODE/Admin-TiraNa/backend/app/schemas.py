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


class UserResponse(BaseModel):
    id: int
    username: str
    email: str
    is_verified: bool
    created_at: datetime
    class Config:
        from_attributes = True


class TokenResponse(BaseModel):
    access_token: str
    token_type: str
    user: UserResponse


# ── Admin Auth Schemas ──

class AdminLoginRequest(BaseModel):
    username: str
    password: str


class AdminResponse(BaseModel):
    id: int
    username: str
    email: str
    is_active: bool
    created_at: datetime
    class Config:
        from_attributes = True


class AdminTokenResponse(BaseModel):
    access_token: str
    token_type: str
    admin: AdminResponse


class AdminCreateRequest(BaseModel):
    username: str
    email: str
    password: str


class AdminUpdateRequest(BaseModel):
    email: Optional[str] = None
    is_active: Optional[bool] = None


# ── Dashboard Stats ──

class DashboardStatsResponse(BaseModel):
    total_users: int
    verified_users: int
    unverified_users: int


class AdminAuditLogResponse(BaseModel):
    id: int
    admin_id: Optional[int] = None
    admin_username: Optional[str] = None
    action: str
    details: Optional[str] = None
    created_at: datetime
    class Config:
        from_attributes = True


# ── Listing Schemas ──

class ListingResponse(BaseModel):
    id: int
    external_id: Optional[str] = None
    title: str
    description: Optional[str] = None
    host_external_id: Optional[str] = None
    host_email: Optional[str] = None
    location: Optional[str] = None
    price_per_night: Optional[Decimal] = None
    status: str
    rejection_reason: Optional[str] = None
    photo_url: Optional[str] = None
    created_at: datetime
    updated_at: Optional[datetime] = None
    class Config:
        from_attributes = True


class ListingActionRequest(BaseModel):
    reason: Optional[str] = None


# ── Booking Schemas ──

class BookingResponse(BaseModel):
    id: int
    external_id: Optional[str] = None
    listing_title: Optional[str] = None
    guest_name: Optional[str] = None
    guest_email: Optional[str] = None
    host_external_id: Optional[str] = None
    check_in: Optional[datetime] = None
    check_out: Optional[datetime] = None
    nights: Optional[int] = None
    total_price: Optional[Decimal] = None
    status: str
    cancellation_reason: Optional[str] = None
    created_at: datetime
    updated_at: Optional[datetime] = None
    class Config:
        from_attributes = True


class BookingCancelRequest(BaseModel):
    reason: str


# ── Payment Schemas ──

class PaymentResponse(BaseModel):
    id: int
    external_id: Optional[str] = None
    booking_external_id: Optional[str] = None
    payer_name: Optional[str] = None
    payer_email: Optional[str] = None
    amount: Decimal
    currency: str
    method: Optional[str] = None
    status: str
    refund_amount: Optional[Decimal] = None
    refund_reason: Optional[str] = None
    created_at: datetime
    updated_at: Optional[datetime] = None
    class Config:
        from_attributes = True


class RefundRequest(BaseModel):
    amount: Decimal
    reason: str


# ── Review Schemas ──

class ReviewResponse(BaseModel):
    id: int
    external_id: Optional[str] = None
    listing_title: Optional[str] = None
    guest_name: Optional[str] = None
    guest_email: Optional[str] = None
    rating: Optional[int] = None
    comment: Optional[str] = None
    is_hidden: bool
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


# ── Withdrawal Schemas ──

class WithdrawalResponse(BaseModel):
    id: int
    external_id: Optional[str] = None
    host_external_id: Optional[str] = None
    host_name: Optional[str] = None
    amount: Decimal
    method: Optional[str] = None
    status: str
    rejection_reason: Optional[str] = None
    created_at: datetime
    updated_at: Optional[datetime] = None
    class Config:
        from_attributes = True


class WithdrawalActionRequest(BaseModel):
    reason: Optional[str] = None


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
