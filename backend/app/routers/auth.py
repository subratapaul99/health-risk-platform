from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.db.database import get_db
from app.db.models import User
from app.models.schemas import AuthLoginInput, AuthRegisterInput, TokenResponse, UserProfile
from app.services.auth_service import (
    create_access_token,
    get_current_user,
    hash_password,
    verify_password,
)

router = APIRouter(prefix="/auth", tags=["User Authentication & Security"])


@router.post("/register", response_model=TokenResponse, summary="Register New User/Clinician")
def register(payload: AuthRegisterInput, db: Session = Depends(get_db)):
    existing = db.query(User).filter(
        (User.username == payload.username) | (User.email == payload.email)
    ).first()
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Username or email already registered.",
        )

    new_user = User(
        username=payload.username,
        email=payload.email,
        hashed_password=hash_password(payload.password),
        full_name=payload.full_name or payload.username,
        is_admin=False,
    )
    db.add(new_user)
    db.commit()
    db.refresh(new_user)

    token = create_access_token({"sub": new_user.username, "is_admin": new_user.is_admin})
    return TokenResponse(
        access_token=token,
        token_type="bearer",
        username=new_user.username,
        full_name=new_user.full_name,
        is_admin=new_user.is_admin,
    )


@router.post("/login", response_model=TokenResponse, summary="Log in & Obtain JWT Token")
def login(payload: AuthLoginInput, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.username == payload.username).first()
    if not user or not verify_password(payload.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid username or password.",
            headers={"WWW-Authenticate": "Bearer"},
        )

    token = create_access_token({"sub": user.username, "is_admin": user.is_admin})
    return TokenResponse(
        access_token=token,
        token_type="bearer",
        username=user.username,
        full_name=user.full_name,
        is_admin=user.is_admin,
    )


@router.get("/me", response_model=UserProfile, summary="Get Current Authenticated User Profile")
def get_me(current_user: User = Depends(get_current_user)):
    return UserProfile(
        id=current_user.id,
        username=current_user.username,
        email=current_user.email,
        full_name=current_user.full_name,
        is_admin=current_user.is_admin,
        created_at=current_user.created_at,
    )
