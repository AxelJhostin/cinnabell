from datetime import date

from typing import Literal

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import func
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session, selectinload

from app.api.deps import get_current_admin
from app.core.database import get_db
from app.core.money import MONEY_ZERO, quantize_money, to_decimal, to_money_float
from app.models.order import Order, OrderStatus, OrderStatusLog
from app.models.order_day import OrderDay
from app.models.product import Product
from app.models.user import User, UserRole
from app.schemas.admin import (
    AdminDashboardAttentionOrderResponse,
    AdminCustomerListItemResponse,
    AdminDashboardSummaryResponse,
    AdminDashboardStatusCountsResponse,
    AdminOrderDayManagementResponse,
    AdminOrderDayResponse,
    AdminOrderDayCreateRequest,
    AdminOrderDayUpdateRequest,
    AdminOrderDetailResponse,
    AdminOrderGuestDataResponse,
    AdminOrderItemDetailResponse,
    AdminOrderItemSelectedFlavorResponse,
    AdminOrderListItemResponse,
    AdminProductManagementResponse,
    AdminProductUpdateRequest,
    AdminReportSummaryResponse,
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
            extra_price = to_money_float(extra_price_raw)
        except (TypeError, ValueError):
            extra_price = 0.0

        normalized_flavors.append(
            AdminOrderItemSelectedFlavorResponse(
                flavor_id=flavor_id,
                name=name,
                extra_price=max(extra_price, 0.0),
            )
        )

    return normalized_flavors


def get_available_slots(order_day: OrderDay) -> int:
    return max(order_day.max_capacity - order_day.current_orders, 0)


def normalize_optional_text(value: str | None) -> str | None:
    if value is None:
        return None
    normalized = value.strip()
    return normalized or None


def build_admin_order_day_response(order_day: OrderDay) -> AdminOrderDayManagementResponse:
    return AdminOrderDayManagementResponse(
        id=order_day.id,
        date=order_day.date,
        is_open=order_day.is_open,
        max_capacity=order_day.max_capacity,
        current_orders=order_day.current_orders,
        is_special=order_day.is_special,
        note=order_day.note,
        available_slots=get_available_slots(order_day),
    )


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
        db.query(func.coalesce(func.sum(Order.total), MONEY_ZERO))
        .join(OrderDay, Order.order_day_id == OrderDay.id)
        .filter(OrderDay.date == today)
        .scalar()
        or MONEY_ZERO
    )

    today_order_days = db.query(OrderDay).filter(OrderDay.date == today).all()
    today_remaining_capacity = sum(
        max(order_day.max_capacity - order_day.current_orders, 0)
        for order_day in today_order_days
    )

    status_rows = (
        db.query(
            Order.status,
            func.count(Order.id),
        )
        .group_by(Order.status)
        .all()
    )
    status_count_by_status = {
        row[0]: int(row[1] or 0)
        for row in status_rows
        if isinstance(row[0], OrderStatus)
    }
    status_counts = AdminDashboardStatusCountsResponse(
        pending=status_count_by_status.get(OrderStatus.pendiente, 0),
        confirmed=status_count_by_status.get(OrderStatus.confirmado, 0),
        in_preparation=status_count_by_status.get(OrderStatus.en_preparacion, 0),
        ready=status_count_by_status.get(OrderStatus.listo, 0),
        delivered=status_count_by_status.get(OrderStatus.entregado, 0),
        cancelled=status_count_by_status.get(OrderStatus.cancelado, 0),
    )

    attention_statuses = [
        OrderStatus.pendiente,
        OrderStatus.confirmado,
        OrderStatus.en_preparacion,
        OrderStatus.listo,
    ]
    attention_orders = (
        db.query(Order)
        .options(selectinload(Order.order_day))
        .filter(Order.status.in_(attention_statuses))
        .order_by(Order.created_at.desc(), Order.id.desc())
        .limit(5)
        .all()
    )
    attention_orders_payload = [
        AdminDashboardAttentionOrderResponse(
            id=order.id,
            tracking_token=order.tracking_token,
            status=order.status,
            total=to_money_float(order.total),
            created_at=order.created_at,
            order_day=build_order_day_response(order.order_day),
        )
        for order in attention_orders
    ]
    attention_orders_count = (
        status_counts.pending
        + status_counts.confirmed
        + status_counts.in_preparation
        + status_counts.ready
    )

    return AdminDashboardSummaryResponse(
        today_date=today,
        today_orders_count=int(today_orders_count),
        today_remaining_capacity=int(today_remaining_capacity),
        today_revenue=to_money_float(today_revenue),
        status_counts=status_counts,
        attention_orders_count=attention_orders_count,
        attention_orders=attention_orders_payload,
    )


@router.get("/reports/summary", response_model=AdminReportSummaryResponse)
def get_admin_reports_summary(
    current_admin: User = Depends(get_current_admin),
    db: Session = Depends(get_db),
) -> AdminReportSummaryResponse:
    today = date.today()

    total_orders = db.query(func.count(Order.id)).scalar() or 0
    total_revenue = db.query(func.coalesce(func.sum(Order.total), MONEY_ZERO)).scalar() or MONEY_ZERO

    orders_today = (
        db.query(func.count(Order.id))
        .join(OrderDay, Order.order_day_id == OrderDay.id)
        .filter(OrderDay.date == today)
        .scalar()
        or 0
    )
    revenue_today = (
        db.query(func.coalesce(func.sum(Order.total), MONEY_ZERO))
        .join(OrderDay, Order.order_day_id == OrderDay.id)
        .filter(OrderDay.date == today)
        .scalar()
        or MONEY_ZERO
    )

    if int(total_orders) > 0:
        average_order_value = quantize_money(to_decimal(total_revenue) / int(total_orders))
    else:
        average_order_value = MONEY_ZERO

    return AdminReportSummaryResponse(
        total_orders=int(total_orders),
        total_revenue=to_money_float(total_revenue),
        average_order_value=to_money_float(average_order_value),
        orders_today=int(orders_today),
        revenue_today=to_money_float(revenue_today),
    )


@router.get("/order-days", response_model=list[AdminOrderDayManagementResponse])
def get_admin_order_days(
    current_admin: User = Depends(get_current_admin),
    db: Session = Depends(get_db),
) -> list[AdminOrderDayManagementResponse]:
    today = date.today()
    order_days = (
        db.query(OrderDay)
        .filter(OrderDay.date >= today)
        .order_by(OrderDay.date.asc())
        .all()
    )
    return [build_admin_order_day_response(order_day) for order_day in order_days]


@router.post("/order-days", response_model=AdminOrderDayManagementResponse, status_code=status.HTTP_201_CREATED)
def create_admin_order_day(
    payload: AdminOrderDayCreateRequest,
    current_admin: User = Depends(get_current_admin),
    db: Session = Depends(get_db),
) -> AdminOrderDayManagementResponse:
    existing_order_day = db.query(OrderDay).filter(OrderDay.date == payload.date).first()
    if existing_order_day is not None:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Ya existe un dia de pedido para esa fecha",
        )

    order_day = OrderDay(
        date=payload.date,
        is_open=payload.is_open,
        max_capacity=int(payload.max_capacity),
        current_orders=0,
        is_special=payload.is_special,
        note=normalize_optional_text(payload.note),
    )

    if get_available_slots(order_day) <= 0:
        order_day.is_open = False

    db.add(order_day)
    try:
        db.commit()
    except IntegrityError:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Ya existe un dia de pedido para esa fecha",
        ) from None

    db.refresh(order_day)
    return build_admin_order_day_response(order_day)


@router.patch("/order-days/{order_day_id}", response_model=AdminOrderDayManagementResponse)
def update_admin_order_day(
    order_day_id: int,
    payload: AdminOrderDayUpdateRequest,
    current_admin: User = Depends(get_current_admin),
    db: Session = Depends(get_db),
) -> AdminOrderDayManagementResponse:
    order_day = db.query(OrderDay).filter(OrderDay.id == order_day_id).first()
    if order_day is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Dia de pedido no encontrado")

    updates = payload.model_dump(exclude_unset=True)

    if "max_capacity" in updates:
        new_max_capacity = int(updates["max_capacity"])
        if new_max_capacity < order_day.current_orders:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="La capacidad maxima no puede ser menor a los pedidos actuales",
            )
        order_day.max_capacity = new_max_capacity

    if "is_special" in updates:
        order_day.is_special = bool(updates["is_special"])

    if "note" in updates:
        raw_note = updates["note"]
        order_day.note = normalize_optional_text(str(raw_note) if raw_note is not None else None)

    if "is_open" in updates:
        requested_is_open = bool(updates["is_open"])
        if requested_is_open and get_available_slots(order_day) <= 0:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="No se puede abrir un dia sin cupos disponibles",
            )
        order_day.is_open = requested_is_open
    elif get_available_slots(order_day) <= 0:
        order_day.is_open = False

    db.commit()
    db.refresh(order_day)
    return build_admin_order_day_response(order_day)


@router.get("/products", response_model=list[AdminProductManagementResponse])
def get_admin_products(
    current_admin: User = Depends(get_current_admin),
    db: Session = Depends(get_db),
) -> list[AdminProductManagementResponse]:
    products = (
        db.query(Product)
        .order_by(Product.is_active.desc(), Product.category.asc(), Product.name.asc())
        .all()
    )
    return [
        AdminProductManagementResponse.model_validate(product, from_attributes=True)
        for product in products
    ]


@router.patch("/products/{product_id}", response_model=AdminProductManagementResponse)
def update_admin_product(
    product_id: int,
    payload: AdminProductUpdateRequest,
    current_admin: User = Depends(get_current_admin),
    db: Session = Depends(get_db),
) -> AdminProductManagementResponse:
    product = db.query(Product).filter(Product.id == product_id).first()
    if product is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Producto no encontrado")

    updates = payload.model_dump(exclude_unset=True)

    if "price" in updates:
        new_price = quantize_money(updates["price"])
        if new_price < 0:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="El precio no puede ser negativo",
            )
        product.price = new_price

    if "description" in updates:
        raw_description = updates["description"]
        if raw_description is None:
            product.description = None
        else:
            normalized_description = str(raw_description).strip()
            product.description = normalized_description or None

    if "image_url" in updates:
        raw_image_url = updates["image_url"]
        if raw_image_url is None:
            product.image_url = None
        else:
            normalized_image_url = str(raw_image_url).strip()
            product.image_url = normalized_image_url or None

    if "is_active" in updates:
        product.is_active = bool(updates["is_active"])

    db.commit()
    db.refresh(product)
    return AdminProductManagementResponse.model_validate(product, from_attributes=True)


@router.get("/customers", response_model=list[AdminCustomerListItemResponse])
def get_admin_customers(
    current_admin: User = Depends(get_current_admin),
    db: Session = Depends(get_db),
) -> list[AdminCustomerListItemResponse]:
    clients = (
        db.query(User)
        .filter(User.role == UserRole.client)
        .order_by(User.name.asc(), User.id.asc())
        .all()
    )
    if not clients:
        return []

    client_ids = [client.id for client in clients]

    metric_rows = (
        db.query(
            Order.user_id.label("user_id"),
            func.count(Order.id).label("orders_count"),
            func.coalesce(func.sum(Order.total), MONEY_ZERO).label("total_spent"),
            func.max(Order.created_at).label("last_order_date"),
        )
        .filter(Order.user_id.in_(client_ids))
        .group_by(Order.user_id)
        .all()
    )

    metrics_by_user_id = {
        int(row.user_id): {
            "orders_count": int(row.orders_count or 0),
            "total_spent": to_money_float(row.total_spent or MONEY_ZERO),
            "last_order_date": row.last_order_date,
        }
        for row in metric_rows
        if row.user_id is not None
    }

    response = [
        AdminCustomerListItemResponse(
            id=client.id,
            name=client.name,
            email=client.email,
            phone=client.phone,
            created_at=client.created_at,
            orders_count=metrics_by_user_id.get(client.id, {}).get("orders_count", 0),
            total_spent=metrics_by_user_id.get(client.id, {}).get("total_spent", 0.0),
            last_order_date=metrics_by_user_id.get(client.id, {}).get("last_order_date"),
        )
        for client in clients
    ]

    response.sort(
        key=lambda item: (
            -item.orders_count,
            item.last_order_date is None,
            -(item.last_order_date.timestamp()) if item.last_order_date else 0.0,
            item.name.lower(),
        )
    )
    return response


@router.get("/orders", response_model=list[AdminOrderListItemResponse])
def get_admin_orders(
    current_admin: User = Depends(get_current_admin),
    db: Session = Depends(get_db),
    status: OrderStatus | None = Query(default=None),
    scope: Literal["recent", "today"] = Query(default="recent"),
) -> list[AdminOrderListItemResponse]:
    today = date.today()

    query = (
        db.query(Order)
        .options(
            selectinload(Order.order_day),
            selectinload(Order.items),
        )
        .join(OrderDay, Order.order_day_id == OrderDay.id)
    )
    if scope == "today":
        query = query.filter(OrderDay.date == today)

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
                total=to_money_float(order.total),
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
            unit_price=to_money_float(item.unit_price),
            subtotal=to_money_float(item.subtotal),
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
        total=to_money_float(order.total),
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
