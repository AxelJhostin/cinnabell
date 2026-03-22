from fastapi import Cookie, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.security import decode_token
from app.models.user import User, UserRole

ACCESS_TOKEN_COOKIE_NAME = "access_token"


def _get_user_from_cookie(access_token: str | None, db: Session) -> User | None:
    if not access_token:
        return None

    payload = decode_token(access_token)
    if not payload:
        return None

    subject = payload.get("sub")
    if subject is None:
        return None

    try:
        user_id = int(subject)
    except (TypeError, ValueError):
        return None

    return db.query(User).filter(User.id == user_id).first()


def get_current_user(
    db: Session = Depends(get_db),
    access_token: str | None = Cookie(default=None, alias=ACCESS_TOKEN_COOKIE_NAME),
) -> User:
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="No autenticado",
        headers={"WWW-Authenticate": "Bearer"},
    )

    user = _get_user_from_cookie(access_token=access_token, db=db)
    if user is None:
        raise credentials_exception

    return user


def get_optional_current_user(
    db: Session = Depends(get_db),
    access_token: str | None = Cookie(default=None, alias=ACCESS_TOKEN_COOKIE_NAME),
) -> User | None:
    return _get_user_from_cookie(access_token=access_token, db=db)


def get_current_admin(current_user: User = Depends(get_current_user)) -> User:
    if current_user.role != UserRole.admin:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="No autorizado: requiere rol admin",
        )
    return current_user
