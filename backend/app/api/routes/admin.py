from fastapi import APIRouter, Depends

from app.api.deps import get_current_admin
from app.models.user import User

router = APIRouter()


@router.get("/health")
def admin_health(current_admin: User = Depends(get_current_admin)) -> dict[str, str | int]:
    return {
        "message": "Acceso admin autorizado",
        "admin_id": current_admin.id,
    }
