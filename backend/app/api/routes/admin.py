from datetime import date

from fastapi import APIRouter, Depends
from sqlalchemy import func
from sqlalchemy.orm import Session

from app.api.deps import get_current_admin
from app.core.database import get_db
from app.models.order import Order
from app.models.order_day import OrderDay
from app.models.user import User
from app.schemas.admin import AdminDashboardSummaryResponse

router = APIRouter()


@router.get("/health")
def admin_health(current_admin: User = Depends(get_current_admin)) -> dict[str, str | int]:
    return {
        "message": "Acceso admin autorizado",
        "admin_id": current_admin.id,
    }


@router.get("/dashboard-summary", response_model=AdminDashboardSummaryResponse)
def get_admin_dashboard_summary(
    current_admin: User = Depends(get_current_admin),
    db: Session = Depends(get_db),
) -> AdminDashboardSummaryResponse:
    today = date.today()

    today_orders_count = (
        db.query(func.count(Order.id))
        .join(OrderDay, Order.order_day_id == OrderDay.id)
        .filter(OrderDay.date == today)
        .scalar()
        or 0
    )

    today_revenue = (
        db.query(func.coalesce(func.sum(Order.total), 0.0))
        .join(OrderDay, Order.order_day_id == OrderDay.id)
        .filter(OrderDay.date == today)
        .scalar()
        or 0.0
    )

    today_order_days = db.query(OrderDay).filter(OrderDay.date == today).all()
    today_remaining_capacity = sum(
        max(order_day.max_capacity - order_day.current_orders, 0)
        for order_day in today_order_days
    )

    return AdminDashboardSummaryResponse(
        today_date=today,
        today_orders_count=int(today_orders_count),
        today_remaining_capacity=int(today_remaining_capacity),
        today_revenue=round(float(today_revenue), 2),
    )
