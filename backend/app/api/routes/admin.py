from datetime import date

from fastapi import APIRouter, Depends, Query
from sqlalchemy import func
from sqlalchemy.orm import Session, selectinload

from app.api.deps import get_current_admin
from app.core.database import get_db
from app.models.order import Order, OrderStatus
from app.models.order_day import OrderDay
from app.models.user import User
from app.schemas.admin import (
    AdminDashboardSummaryResponse,
    AdminOrderDayResponse,
    AdminOrderGuestDataResponse,
    AdminOrderListItemResponse,
)

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


@router.get("/orders", response_model=list[AdminOrderListItemResponse])
def get_admin_orders(
    current_admin: User = Depends(get_current_admin),
    db: Session = Depends(get_db),
    status: OrderStatus | None = Query(default=None),
) -> list[AdminOrderListItemResponse]:
    today = date.today()

    query = (
        db.query(Order)
        .options(
            selectinload(Order.order_day),
            selectinload(Order.items),
        )
        .join(OrderDay, Order.order_day_id == OrderDay.id)
        .filter(OrderDay.date == today)
    )
    if status is not None:
        query = query.filter(Order.status == status)

    orders = query.order_by(Order.created_at.desc(), Order.id.desc()).all()

    response_items: list[AdminOrderListItemResponse] = []
    for order in orders:
        guest_data_raw = order.guest_data if isinstance(order.guest_data, dict) else None
        guest_data = (
            AdminOrderGuestDataResponse(
                name=guest_data_raw.get("name"),
                email=guest_data_raw.get("email"),
                phone=guest_data_raw.get("phone"),
            )
            if guest_data_raw
            else None
        )

        if order.order_day is None:
            continue

        response_items.append(
            AdminOrderListItemResponse(
                id=order.id,
                tracking_token=order.tracking_token,
                status=order.status,
                total=round(float(order.total), 2),
                created_at=order.created_at,
                guest_data=guest_data,
                order_day=AdminOrderDayResponse.model_validate(
                    order.order_day, from_attributes=True
                ),
                items_count=len(order.items),
            )
        )

    return response_items
