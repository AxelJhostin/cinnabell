from datetime import date, datetime

from pydantic import BaseModel, ConfigDict, EmailStr

from app.models.order import OrderStatus


class AdminDashboardSummaryResponse(BaseModel):
    today_date: date
    today_orders_count: int
    today_remaining_capacity: int
    today_revenue: float


class AdminOrderGuestDataResponse(BaseModel):
    name: str | None = None
    email: EmailStr | None = None
    phone: str | None = None


class AdminOrderDayResponse(BaseModel):
    id: int
    date: date

    model_config = ConfigDict(from_attributes=True)


class AdminOrderListItemResponse(BaseModel):
    id: int
    tracking_token: str
    status: OrderStatus
    total: float
    created_at: datetime | None = None
    guest_data: AdminOrderGuestDataResponse | None = None
    order_day: AdminOrderDayResponse
    items_count: int
