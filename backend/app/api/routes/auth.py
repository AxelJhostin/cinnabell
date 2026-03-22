from fastapi import APIRouter, Depends, HTTPException, Response, status
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.api.deps import ACCESS_TOKEN_COOKIE_NAME, get_current_user
from app.core.config import settings
from app.core.database import get_db
from app.core.security import create_access_token, get_password_hash, verify_password
from app.models.user import User, UserRole
from app.schemas.auth import (
    LoginRequest,
    MessageResponse,
    RegisterRequest,
    UserPublicResponse,
)

router = APIRouter()


def _get_auth_cookie_settings() -> dict[str, str | bool]:
    is_production = settings.ENVIRONMENT.lower() == "production"
    cookie_samesite = "none" if is_production else "lax"
    return {
        "httponly": True,
        "samesite": cookie_samesite,
        "secure": is_production,
        "path": "/",
    }


@router.post("/register", response_model=UserPublicResponse, status_code=status.HTTP_201_CREATED)
def register_user(payload: RegisterRequest, db: Session = Depends(get_db)) -> UserPublicResponse:
    normalized_email = payload.email.lower()
    existing_user = db.query(User).filter(User.email == normalized_email).first()
    if existing_user:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="El email ya esta registrado")

    user = User(
        name=payload.name,
        email=normalized_email,
        phone=payload.phone,
        password_hash=get_password_hash(payload.password),
        role=UserRole.client,
    )
    db.add(user)

    try:
        db.commit()
    except IntegrityError:
        db.rollback()
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="El email ya esta registrado")

    db.refresh(user)
    return user


@router.post("/login", response_model=MessageResponse)
def login_user(
    payload: LoginRequest,
    response: Response,
    db: Session = Depends(get_db),
) -> MessageResponse:
    normalized_email = payload.email.lower()
    user = db.query(User).filter(User.email == normalized_email).first()

    if user is None or not verify_password(payload.password, user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Credenciales invalidas",
            headers={"WWW-Authenticate": "Bearer"},
        )

    token = create_access_token({"sub": str(user.id), "role": user.role.value})
    max_age = settings.ACCESS_TOKEN_EXPIRE_MINUTES * 60
    cookie_settings = _get_auth_cookie_settings()

    response.set_cookie(
        key=ACCESS_TOKEN_COOKIE_NAME,
        value=token,
        max_age=max_age,
        expires=max_age,
        **cookie_settings,
    )

    return MessageResponse(message="Inicio de sesion exitoso")


@router.post("/logout", response_model=MessageResponse)
def logout_user(response: Response) -> MessageResponse:
    cookie_settings = _get_auth_cookie_settings()

    response.delete_cookie(
        key=ACCESS_TOKEN_COOKIE_NAME,
        path=str(cookie_settings["path"]),
        secure=bool(cookie_settings["secure"]),
        httponly=bool(cookie_settings["httponly"]),
        samesite=str(cookie_settings["samesite"]),
    )

    return MessageResponse(message="Logged out")


@router.get("/me", response_model=UserPublicResponse)
def get_me(current_user: User = Depends(get_current_user)) -> UserPublicResponse:
    return current_user
