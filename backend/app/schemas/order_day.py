from datetime import date

from pydantic import BaseModel, ConfigDict


class OrderDayBaseResponse(BaseModel):
    id: int
    date: date
    is_open: bool
    max_capacity: int
    current_orders: int
    is_special: bool
    note: str | None = None

    model_config = ConfigDict(from_attributes=True)


class OrderDayListResponse(OrderDayBaseResponse):
    pass


class OrderDayDetailResponse(OrderDayBaseResponse):
    pass
