from datetime import date

from pydantic import BaseModel, ConfigDict, computed_field


class OrderDayBaseResponse(BaseModel):
    id: int
    date: date
    is_open: bool
    max_capacity: int
    current_orders: int
    is_special: bool
    note: str | None = None

    model_config = ConfigDict(from_attributes=True)

    @computed_field(return_type=int)
    @property
    def available_slots(self) -> int:
        return max(self.max_capacity - self.current_orders, 0)


class OrderDayListResponse(OrderDayBaseResponse):
    pass


class OrderDayDetailResponse(OrderDayBaseResponse):
    pass
