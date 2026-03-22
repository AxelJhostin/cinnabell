from datetime import date

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.models.order_day import OrderDay
from app.schemas.order_day import OrderDayDetailResponse, OrderDayListResponse

router = APIRouter()


def sync_day_closure_if_full(order_day: OrderDay) -> bool:
    if order_day.max_capacity <= 0 and order_day.is_open:
        order_day.is_open = False
        return True

    if order_day.current_orders >= order_day.max_capacity and order_day.is_open:
        order_day.is_open = False
        return True

    return False


@router.get("", response_model=list[OrderDayListResponse])
def list_order_days(db: Session = Depends(get_db)) -> list[OrderDayListResponse]:
    today = date.today()
    order_days = (
        db.query(OrderDay)
        .filter(OrderDay.date >= today)
        .order_by(OrderDay.date.asc())
        .all()
    )
    has_updates = any(sync_day_closure_if_full(order_day) for order_day in order_days)
    if has_updates:
        db.commit()
    return order_days


@router.get("/{order_date}", response_model=OrderDayDetailResponse)
def get_order_day(order_date: date, db: Session = Depends(get_db)) -> OrderDayDetailResponse:
    order_day = db.query(OrderDay).filter(OrderDay.date == order_date).first()
    if order_day is None:
        raise HTTPException(status_code=404, detail="Dia de pedido no encontrado")

    if sync_day_closure_if_full(order_day):
        db.commit()
        db.refresh(order_day)

    return order_day
