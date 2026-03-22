from uuid import uuid4

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.exc import SQLAlchemyError
from sqlalchemy.orm import Session, selectinload

from app.core.database import get_db
from app.models.order import Order, OrderItem, OrderStatus, OrderStatusLog
from app.models.order_day import OrderDay
from app.models.product import Product
from app.schemas.order import CreateOrderRequest, CreateOrderResponse, TrackOrderResponse

router = APIRouter()


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


@router.post("", response_model=CreateOrderResponse, status_code=status.HTTP_201_CREATED)
def create_order(payload: CreateOrderRequest, db: Session = Depends(get_db)) -> CreateOrderResponse:
    order_day = db.query(OrderDay).filter(OrderDay.id == payload.order_day_id).first()
    if order_day is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Dia de pedido no encontrado")

    if not order_day.is_open:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="El dia de pedido esta cerrado")

    if order_day.current_orders >= order_day.max_capacity:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="No hay cupos disponibles para este dia")

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
        tracking_token = generate_tracking_token(db)

        order = Order(
            user_id=None,
            guest_data=payload.guest_data.model_dump(),
            order_day_id=order_day.id,
            status=OrderStatus.pendiente,
            total=0,
            tracking_token=tracking_token,
        )
        db.add(order)
        db.flush()

        total = 0.0
        for item in payload.items:
            product = product_by_id[item.product_id]
            flavors_payload = [flavor.model_dump(exclude_none=True) for flavor in item.selected_flavors]
            flavors_extra = sum(flavor.extra_price for flavor in item.selected_flavors)

            unit_price = round(product.price + flavors_extra, 2)
            subtotal = round(unit_price * item.quantity, 2)
            total += subtotal

            order_item = OrderItem(
                order_id=order.id,
                product_id=product.id,
                quantity=item.quantity,
                selected_flavors=flavors_payload or None,
                unit_price=unit_price,
                subtotal=subtotal,
            )
            db.add(order_item)

        order.total = round(total, 2)
        order_day.current_orders += 1

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
            selectinload(Order.status_log),
        )
        .filter(Order.tracking_token == token)
        .first()
    )
    if order is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Pedido no encontrado")
    return order
