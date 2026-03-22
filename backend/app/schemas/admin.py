from datetime import date, datetime

from pydantic import BaseModel, ConfigDict, EmailStr, Field

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


class AdminOrderItemSelectedFlavorResponse(BaseModel):
    flavor_id: int | None = None
    name: str | None = None
    extra_price: float = Field(default=0, ge=0)


class AdminOrderItemDetailResponse(BaseModel):
    id: int
    product_id: int
    quantity: int
    unit_price: float
    subtotal: float
    selected_flavors: list[AdminOrderItemSelectedFlavorResponse] = Field(default_factory=list)

    model_config = ConfigDict(from_attributes=True)


class AdminOrderStatusLogDetailResponse(BaseModel):
    id: int
    old_status: OrderStatus | None = None
    new_status: OrderStatus
    note: str | None = None
    changed_at: datetime | None = None

    model_config = ConfigDict(from_attributes=True)


class AdminOrderDetailResponse(BaseModel):
    id: int
    tracking_token: str
    status: OrderStatus
    total: float
    created_at: datetime | None = None
    guest_data: AdminOrderGuestDataResponse | None = None
    order_day: AdminOrderDayResponse
    items: list[AdminOrderItemDetailResponse]
    status_log: list[AdminOrderStatusLogDetailResponse]
    items_count: int


class AdminOrderStatusUpdateRequest(BaseModel):
    new_status: OrderStatus
    note: str | None = Field(default=None, max_length=500)

    model_config = ConfigDict(str_strip_whitespace=True)


class AdminOrderStatusUpdateResponse(BaseModel):
    order_id: int
    previous_status: OrderStatus
    current_status: OrderStatus
    note: str | None = None
    changed_at: datetime | None = None
