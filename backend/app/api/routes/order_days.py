from datetime import date

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.models.order_day import OrderDay
from app.schemas.order_day import OrderDayDetailResponse, OrderDayListResponse

router = APIRouter()


@router.get("", response_model=list[OrderDayListResponse])
def list_order_days(db: Session = Depends(get_db)) -> list[OrderDayListResponse]:
    today = date.today()
    order_days = (
        db.query(OrderDay)
        .filter(OrderDay.date >= today)
        .order_by(OrderDay.date.asc())
        .all()
    )
    return order_days


@router.get("/{order_date}", response_model=OrderDayDetailResponse)
def get_order_day(order_date: date, db: Session = Depends(get_db)) -> OrderDayDetailResponse:
    order_day = db.query(OrderDay).filter(OrderDay.date == order_date).first()
    if order_day is None:
        raise HTTPException(status_code=404, detail="Día de pedido no encontrado")
    return order_day
