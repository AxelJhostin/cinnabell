from datetime import date

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import func
from sqlalchemy.orm import Session, selectinload

from app.api.deps import get_current_admin
from app.core.database import get_db
from app.models.order import Order, OrderStatus, OrderStatusLog
from app.models.order_day import OrderDay
from app.models.user import User
from app.schemas.admin import (
    AdminDashboardSummaryResponse,
    AdminOrderDayResponse,
    AdminOrderDetailResponse,
    AdminOrderGuestDataResponse,
    AdminOrderItemDetailResponse,
    AdminOrderItemSelectedFlavorResponse,
    AdminOrderListItemResponse,
    AdminOrderStatusUpdateRequest,
    AdminOrderStatusUpdateResponse,
    AdminOrderStatusLogDetailResponse,
)

router = APIRouter()


def build_guest_data_response(raw_guest_data: object) -> AdminOrderGuestDataResponse | None:
    if not isinstance(raw_guest_data, dict):
        return None
    return AdminOrderGuestDataResponse(
        name=raw_guest_data.get("name"),
        email=raw_guest_data.get("email"),
        phone=raw_guest_data.get("phone"),
    )


def build_order_day_response(order_day: OrderDay | None) -> AdminOrderDayResponse:
    if order_day is None:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Pedido sin dia de pedido asociado",
        )
    return AdminOrderDayResponse.model_validate(order_day, from_attributes=True)


def build_selected_flavors(raw_flavors: object) -> list[AdminOrderItemSelectedFlavorResponse]:
    if not isinstance(raw_flavors, list):
        return []

    normalized_flavors: list[AdminOrderItemSelectedFlavorResponse] = []
    for raw_flavor in raw_flavors:
        if not isinstance(raw_flavor, dict):
            continue

        flavor_id_raw = raw_flavor.get("flavor_id")
        name_raw = raw_flavor.get("name")
        extra_price_raw = raw_flavor.get("extra_price", 0)

        flavor_id = flavor_id_raw if isinstance(flavor_id_raw, int) else None
        name = name_raw if isinstance(name_raw, str) else None

        try:
            extra_price = float(extra_price_raw)
        except (TypeError, ValueError):
            extra_price = 0

        normalized_flavors.append(
            AdminOrderItemSelectedFlavorResponse(
                flavor_id=flavor_id,
                name=name,
                extra_price=max(extra_price, 0),
            )
        )

    return normalized_flavors


def can_transition_status(current_status: OrderStatus, new_status: OrderStatus) -> bool:
    if current_status == new_status:
        return False

    final_statuses = {OrderStatus.entregado, OrderStatus.cancelado}
    if current_status in final_statuses:
        return False

    return True


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
        response_items.append(
            AdminOrderListItemResponse(
                id=order.id,
                tracking_token=order.tracking_token,
                status=order.status,
                total=round(float(order.total), 2),
                created_at=order.created_at,
                guest_data=build_guest_data_response(order.guest_data),
                order_day=build_order_day_response(order.order_day),
                items_count=len(order.items),
            )
        )

    return response_items


@router.get("/orders/{order_id}", response_model=AdminOrderDetailResponse)
def get_admin_order_detail(
    order_id: int,
    current_admin: User = Depends(get_current_admin),
    db: Session = Depends(get_db),
) -> AdminOrderDetailResponse:
    order = (
        db.query(Order)
        .options(
            selectinload(Order.order_day),
            selectinload(Order.items),
            selectinload(Order.status_log),
        )
        .filter(Order.id == order_id)
        .first()
    )
    if order is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Pedido no encontrado")

    order_items = [
        AdminOrderItemDetailResponse(
            id=item.id,
            product_id=item.product_id,
            quantity=item.quantity,
            unit_price=round(float(item.unit_price), 2),
            subtotal=round(float(item.subtotal), 2),
            selected_flavors=build_selected_flavors(item.selected_flavors),
        )
        for item in order.items
    ]

    status_log = [
        AdminOrderStatusLogDetailResponse.model_validate(log_entry, from_attributes=True)
        for log_entry in sorted(order.status_log, key=lambda entry: entry.id)
    ]

    return AdminOrderDetailResponse(
        id=order.id,
        tracking_token=order.tracking_token,
        status=order.status,
        total=round(float(order.total), 2),
        created_at=order.created_at,
        guest_data=build_guest_data_response(order.guest_data),
        order_day=build_order_day_response(order.order_day),
        items=order_items,
        status_log=status_log,
        items_count=len(order_items),
    )


@router.patch("/orders/{order_id}/status", response_model=AdminOrderStatusUpdateResponse)
def update_admin_order_status(
    order_id: int,
    payload: AdminOrderStatusUpdateRequest,
    current_admin: User = Depends(get_current_admin),
    db: Session = Depends(get_db),
) -> AdminOrderStatusUpdateResponse:
    order = db.query(Order).filter(Order.id == order_id).first()
    if order is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Pedido no encontrado")

    previous_status = order.status
    new_status = payload.new_status

    if not can_transition_status(previous_status, new_status):
        if previous_status == new_status:
            detail = "El pedido ya se encuentra en ese estado"
        else:
            detail = "No se puede cambiar el estado de un pedido finalizado"
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=detail)

    normalized_note = payload.note.strip() if isinstance(payload.note, str) else None
    if normalized_note == "":
        normalized_note = None

    status_log_entry = OrderStatusLog(
        order_id=order.id,
        old_status=previous_status,
        new_status=new_status,
        note=normalized_note,
    )

    order.status = new_status
    db.add(status_log_entry)
    db.commit()
    db.refresh(order)
    db.refresh(status_log_entry)

    return AdminOrderStatusUpdateResponse(
        order_id=order.id,
        previous_status=previous_status,
        current_status=order.status,
        note=status_log_entry.note,
        changed_at=status_log_entry.changed_at,
    )
