from uuid import uuid4

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.exc import SQLAlchemyError
from sqlalchemy.orm import Session, selectinload

from app.api.deps import get_current_user, get_optional_current_user
from app.core.database import get_db
from app.core.money import MONEY_ZERO, quantize_money, to_decimal, to_money_float
from app.models.order import Order, OrderItem, OrderStatus, OrderStatusLog
from app.models.order_day import OrderDay
from app.models.product import Product
from app.models.user import User
from app.schemas.order import (
    CreateOrderRequest,
    CreateOrderResponse,
    MyOrderListItemResponse,
    TrackOrderResponse,
)

router = APIRouter()


def get_available_slots(order_day: OrderDay) -> int:
    return max(order_day.max_capacity - order_day.current_orders, 0)


def generate_tracking_token(db: Session) -> str:
    for _ in range(5):
        token = uuid4().hex
        exists = db.query(Order.id).filter(Order.tracking_token == token).first()
        if exists is None:
            return token
    raise HTTPException(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        detail="No se pudo generar un token de seguimiento unico",
    )


def resolve_item_name(order_item: OrderItem) -> str:
    if order_item.product_name:
        return order_item.product_name

    if getattr(order_item, "product", None) is not None and getattr(order_item.product, "name", None):
        return str(order_item.product.name)

    return f"Producto #{order_item.product_id}"


@router.post("", response_model=CreateOrderResponse, status_code=status.HTTP_201_CREATED)
def create_order(
    payload: CreateOrderRequest,
    db: Session = Depends(get_db),
    current_user: User | None = Depends(get_optional_current_user),
) -> CreateOrderResponse:
    product_ids = {item.product_id for item in payload.items}
    products = (
        db.query(Product)
        .filter(Product.id.in_(product_ids), Product.is_active.is_(True))
        .all()
    )
    product_by_id = {product.id: product for product in products}

    missing_product_ids = sorted(product_ids - set(product_by_id.keys()))
    if missing_product_ids:
        missing_ids_text = ", ".join(str(product_id) for product_id in missing_product_ids)
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Productos invalidos o inactivos: {missing_ids_text}",
        )

    try:
        order_day = (
            db.query(OrderDay)
            .filter(OrderDay.id == payload.order_day_id)
            .with_for_update()
            .first()
        )
        if order_day is None:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Dia de pedido no encontrado")

        if not order_day.is_open:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="El dia de pedido esta cerrado")

        if get_available_slots(order_day) <= 0:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="No hay cupos disponibles para este dia",
            )

        tracking_token = generate_tracking_token(db)

        if current_user is not None:
            guest_data_payload = {
                "name": current_user.name,
                "email": current_user.email,
                "phone": current_user.phone,
            }
            user_id = current_user.id
        else:
            if payload.guest_data is None:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Los datos de contacto son obligatorios para pedidos de invitado",
                )
            guest_data_payload = payload.guest_data.model_dump()
            user_id = None

        order = Order(
            user_id=user_id,
            guest_data=guest_data_payload,
            order_day_id=order_day.id,
            status=OrderStatus.pendiente,
            total=0,
            tracking_token=tracking_token,
        )
        db.add(order)
        db.flush()

        total = MONEY_ZERO
        for item in payload.items:
            product = product_by_id[item.product_id]
            flavors_payload: list[dict[str, object]] = []
            flavors_extra = MONEY_ZERO
            for flavor in item.selected_flavors:
                flavor_extra_price = quantize_money(flavor.extra_price)
                flavors_extra += flavor_extra_price
                flavors_payload.append(
                    {
                        "flavor_id": flavor.flavor_id,
                        "name": flavor.name,
                        "extra_price": to_money_float(flavor_extra_price),
                    }
                )

            unit_price = quantize_money(to_decimal(product.price) + flavors_extra)
            subtotal = quantize_money(unit_price * item.quantity)
            total = quantize_money(total + subtotal)

            order_item = OrderItem(
                order_id=order.id,
                product_id=product.id,
                product_name=product.name,
                quantity=item.quantity,
                selected_flavors=flavors_payload or None,
                unit_price=unit_price,
                subtotal=subtotal,
            )
            db.add(order_item)

        order.total = quantize_money(total)
        order_day.current_orders += 1
        if get_available_slots(order_day) <= 0:
            order_day.is_open = False

        status_log = OrderStatusLog(
            order_id=order.id,
            old_status=None,
            new_status=OrderStatus.pendiente,
            note="Creacion inicial del pedido",
        )
        db.add(status_log)

        db.commit()
        db.refresh(order)
        return order
    except HTTPException:
        db.rollback()
        raise
    except SQLAlchemyError:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="No se pudo crear el pedido",
        )


@router.get("/track/{token}", response_model=TrackOrderResponse)
def track_order_by_token(token: str, db: Session = Depends(get_db)) -> TrackOrderResponse:
    order = (
        db.query(Order)
        .options(
            selectinload(Order.order_day),
            selectinload(Order.items),
            selectinload(Order.items).selectinload(OrderItem.product),
            selectinload(Order.status_log),
        )
        .filter(Order.tracking_token == token)
        .first()
    )
    if order is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Pedido no encontrado")
    return order


@router.get("/my", response_model=list[MyOrderListItemResponse])
def get_my_orders(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> list[MyOrderListItemResponse]:
    orders = (
        db.query(Order)
        .options(
            selectinload(Order.order_day),
            selectinload(Order.items),
            selectinload(Order.items).selectinload(OrderItem.product),
        )
        .filter(Order.user_id == current_user.id)
        .order_by(Order.created_at.desc(), Order.id.desc())
        .all()
    )

    return [
        MyOrderListItemResponse(
            id=order.id,
            tracking_token=order.tracking_token,
            status=order.status,
            total=to_money_float(order.total),
            created_at=order.created_at,
            order_day=order.order_day,
            items_count=len(order.items),
            item_names=[resolve_item_name(item) for item in order.items],
        )
        for order in orders
    ]
