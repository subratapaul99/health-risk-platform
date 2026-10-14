"""
Authentication and User Security Service.

Implements:
- Password hashing & verification with bcrypt
- JWT token issuing, expiry & decoding
- Current user dependency for protected routes
- Seed demo user / admin
"""

import datetime
import os
from typing import Optional

import bcrypt
import jwt
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from sqlalchemy.orm import Session

from app.db.database import get_db
from app.db.models import User

# Secure secret key with fallback for dev
SECRET_KEY = os.getenv("JWT_SECRET_KEY", "health-risk-platform-super-secret-key-2026-production-ready")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 60 * 24 * 7  # 7 days

security = HTTPBearer(auto_error=False)


def hash_password(password: str) -> str:
    salt = bcrypt.gensalt(rounds=12)
    return bcrypt.hashpw(password.encode("utf-8"), salt).decode("utf-8")


def verify_password(plain_password: str, hashed_password: str) -> bool:
    try:
        return bcrypt.checkpw(plain_password.encode("utf-8"), hashed_password.encode("utf-8"))
    except Exception:
        return False


def create_access_token(data: dict, expires_delta: Optional[datetime.timedelta] = None) -> str:
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.datetime.utcnow() + expires_delta
    else:
        expire = datetime.datetime.utcnow() + datetime.timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt


def get_current_user_optional(
    credentials: Optional[HTTPAuthorizationCredentials] = Depends(security),
    db: Session = Depends(get_db),
) -> Optional[User]:
    if not credentials:
        return None
    token = credentials.credentials
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        username: str = payload.get("sub")
        if username is None:
            return None
    except Exception:
        return None

    user = db.query(User).filter(User.username == username).first()
    return user


def get_current_user(
    current_user: Optional[User] = Depends(get_current_user_optional),
) -> User:
    if not current_user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authentication required. Please log in.",
            headers={"WWW-Authenticate": "Bearer"},
        )
    return current_user


def init_default_users(db: Session):
    """Seed demo user & admin if they don't already exist."""
    demo_user = db.query(User).filter(User.username == "demo_user").first()
    if not demo_user:
        demo_user = User(
            username="demo_user",
            email="demo@healthrisk.ai",
            hashed_password=hash_password("demo1234"),
            full_name="Demo Clinical User",
            is_admin=False,
        )
        db.add(demo_user)

    admin_user = db.query(User).filter(User.username == "admin").first()
    if not admin_user:
        admin_user = User(
            username="admin",
            email="admin@healthrisk.ai",
            hashed_password=hash_password("admin1234"),
            full_name="Platform Administrator",
            is_admin=True,
        )
        db.add(admin_user)

    db.commit()
