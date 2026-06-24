import smtplib
import random
import string
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from datetime import datetime, timedelta
import bcrypt
from jose import jwt
from fastapi import FastAPI, Depends, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from sqlalchemy import text
from .database import engine, get_db, SessionLocal, Base
from .models import User, AdminAccount, SystemSetting
from .schemas import SignupRequest, VerifyRequest, SigninRequest, TokenResponse, UserResponse
from .config import get_settings
from .routes.admin_auth import router as admin_auth_router
from .routes.admin_dashboard import router as admin_dashboard_router
from .routes.admin_users import router as admin_users_router
from .routes.admin_listings import router as admin_listings_router
from .routes.admin_bookings import router as admin_bookings_router
from .routes.admin_payments import router as admin_payments_router
from .routes.admin_reviews import router as admin_reviews_router
from .routes.admin_support import router as admin_support_router
from .routes.admin_disputes import router as admin_disputes_router
from .routes.admin_withdrawals import router as admin_withdrawals_router
from .routes.admin_settings import router as admin_settings_router
from .routes.admin_management import router as admin_management_router
from .routes.admin_audit import router as admin_audit_router
from .middleware.admin_auth import create_admin_token

settings = get_settings()

app = FastAPI(
    title="TiraNa Admin API",
    description="FastAPI backend for TiraNa Admin System",
    version="1.0.0",
)

cors_origins = [o.strip() for o in settings.CORS_ORIGINS.split(",") if o.strip()]
app.add_middleware(
    CORSMiddleware,
    allow_origins=cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(admin_auth_router)
app.include_router(admin_dashboard_router)
app.include_router(admin_users_router)
app.include_router(admin_listings_router)
app.include_router(admin_bookings_router)
app.include_router(admin_payments_router)
app.include_router(admin_reviews_router)
app.include_router(admin_support_router)
app.include_router(admin_disputes_router)
app.include_router(admin_withdrawals_router)
app.include_router(admin_settings_router)
app.include_router(admin_management_router)
app.include_router(admin_audit_router)


@app.on_event("startup")
def startup():
    Base.metadata.create_all(bind=engine)
    seed_default_admin()
    seed_default_settings()


def seed_default_admin():
    session = SessionLocal()
    try:
        existing = session.query(AdminAccount).filter(
            AdminAccount.username == "admin"
        ).first()
        if not existing:
            hashed = bcrypt.hashpw("admin123".encode("utf-8"), bcrypt.gensalt()).decode("utf-8")
            admin = AdminAccount(
                username="admin",
                email="admin@tirana.com",
                password_hash=hashed,
                is_active=True,
            )
            session.add(admin)
            session.commit()
            print("[SEED] Default admin created (username: admin, password: admin123)")
        else:
            print("[SEED] Admin account already exists, skipping")
    except Exception as e:
        session.rollback()
        print(f"[SEED] Error seeding admin: {e}")
    finally:
        session.close()


def seed_default_settings():
    defaults = {
        "commission_percentage": ("10", "Platform commission percentage"),
        "host_api_base_url": ("http://localhost:5000", "Host module API base URL"),
        "host_api_key": ("", "API key for Host module communication"),
        "platform_name": ("TiraNa", "Platform display name"),
        "support_email": ("support@tirana.com", "Support contact email"),
        "min_payout_amount": ("500", "Minimum withdrawal amount (PHP)"),
        "max_refund_days": ("30", "Max days after booking to request refund"),
    }

    session = SessionLocal()
    try:
        for key, (value, desc) in defaults.items():
            existing = session.query(SystemSetting).filter(SystemSetting.key == key).first()
            if not existing:
                session.add(SystemSetting(key=key, value=value, description=desc))
        session.commit()
        print("[SEED] Default settings ensured")
    except Exception as e:
        session.rollback()
        print(f"[SEED] Error seeding settings: {e}")
    finally:
        session.close()


def generate_code(length: int = 6) -> str:
    return "".join(random.choices(string.digits, k=length))


def send_verification_email(email: str, code: str):
    msg = MIMEMultipart("alternative")
    msg["From"] = settings.SMTP_FROM
    msg["To"] = email
    msg["Subject"] = "TiraNa - Email Verification Code"

    html = f"""
    <html>
    <body style="font-family: Arial, sans-serif; background-color: #f4f4f4; padding: 20px;">
        <div style="max-width: 500px; margin: auto; background: #ffffff; border-radius: 10px; overflow: hidden; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
            <div style="background: linear-gradient(135deg, #3b82f6, #8b5cf6); padding: 30px; text-align: center;">
                <h1 style="color: #ffffff; margin: 0; font-size: 24px;">TiraNa Admin</h1>
            </div>
            <div style="padding: 30px; text-align: center;">
                <h2 style="color: #333; margin-bottom: 10px;">Email Verification</h2>
                <p style="color: #666; font-size: 14px;">Use the code below to verify your email address:</p>
                <div style="margin: 25px 0; padding: 15px; background: #f0f4ff; border-radius: 8px; border: 2px dashed #3b82f6;">
                    <span style="font-size: 36px; font-weight: bold; color: #1e40af; letter-spacing: 8px;">{code}</span>
                </div>
                <p style="color: #999; font-size: 12px;">This code expires in 10 minutes. Do not share this code with anyone.</p>
            </div>
            <div style="background: #f9fafb; padding: 15px; text-align: center; border-top: 1px solid #eee;">
                <p style="color: #aaa; font-size: 11px; margin: 0;">TiraNa Admin System &copy; 2026</p>
            </div>
        </div>
    </body>
    </html>
    """

    msg.attach(MIMEText(html, "html"))

    with smtplib.SMTP(settings.SMTP_HOST, settings.SMTP_PORT) as server:
        server.starttls()
        server.login(settings.SMTP_USER, settings.SMTP_PASS)
        server.sendmail(settings.SMTP_FROM, email, msg.as_string())


def create_access_token(data: dict) -> str:
    to_encode = data.copy()
    expire = datetime.utcnow() + timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, settings.SECRET_KEY, algorithm=settings.ALGORITHM)


@app.get("/")
def root():
    return {"message": "TiraNa Admin API is running"}


@app.get("/health")
def health_check(db: Session = Depends(get_db)):
    try:
        db.execute(text("SELECT 1"))
        return {"status": "healthy", "database": "connected"}
    except Exception as e:
        raise HTTPException(status_code=503, detail=f"Database error: {str(e)}")


@app.post("/auth/signin", response_model=TokenResponse)
def signin(request: SigninRequest, db: Session = Depends(get_db)):
    user = db.query(User).filter(
        (User.email == request.email_or_username) |
        (User.username == request.email_or_username)
    ).first()

    if not user:
        raise HTTPException(status_code=401, detail="Invalid email/username or password")

    if not bcrypt.checkpw(request.password.encode("utf-8"), user.password_hash.encode("utf-8")):
        raise HTTPException(status_code=401, detail="Invalid email/username or password")

    if not user.is_verified:
        raise HTTPException(status_code=401, detail="Email not verified. Please check your inbox.")

    access_token = create_access_token(data={
        "sub": str(user.id),
        "username": user.username,
        "email": user.email,
    })

    return TokenResponse(
        access_token=access_token,
        token_type="bearer",
        user=user,
    )


@app.post("/auth/signup", response_model=dict, status_code=201)
def signup(request: SignupRequest, db: Session = Depends(get_db)):
    if len(request.username) < 3:
        raise HTTPException(status_code=400, detail="Username must be at least 3 characters")
    if len(request.password) < 6:
        raise HTTPException(status_code=400, detail="Password must be at least 6 characters")

    existing = db.query(User).filter(
        (User.username == request.username) | (User.email == request.email)
    ).first()
    if existing:
        if existing.username == request.username:
            raise HTTPException(status_code=400, detail="Username already taken")
        raise HTTPException(status_code=400, detail="Email already registered")

    code = generate_code()
    hashed_password = bcrypt.hashpw(request.password.encode("utf-8"), bcrypt.gensalt()).decode("utf-8")

    new_user = User(
        username=request.username,
        email=request.email,
        password_hash=hashed_password,
        verification_code=code,
        is_verified=False,
    )
    db.add(new_user)
    db.flush()

    try:
        send_verification_email(request.email, code)
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Failed to send verification email: {str(e)}")

    db.commit()
    return {"message": "Verification code sent to your email", "email": request.email}


@app.post("/auth/verify", response_model=UserResponse)
def verify_email(request: VerifyRequest, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == request.email).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    if user.is_verified:
        raise HTTPException(status_code=400, detail="Email already verified")

    if user.verification_code != request.code:
        raise HTTPException(status_code=400, detail="Invalid verification code")

    user.is_verified = True
    user.verification_code = None
    db.commit()
    db.refresh(user)

    return user


@app.get("/users", response_model=list[UserResponse])
def get_users(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    users = db.query(User).offset(skip).limit(limit).all()
    return users


@app.get("/users/{user_id}", response_model=UserResponse)
def get_user(user_id: int, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return user
