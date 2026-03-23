from datetime import date, datetime

from pydantic import BaseModel, ConfigDict, EmailStr, Field

from app.models.order import OrderStatus


class GuestDataInput(BaseModel):
    name: str = Field(min_length=1, max_length=120)
    email: EmailStr
    phone: str = Field(min_length=7, max_length=30)

    model_config = ConfigDict(str_strip_whitespace=True)


class OrderItemSelectedFlavorInput(BaseModel):
    flavor_id: int | None = None
    name: str | None = Field(default=None, max_length=100)
    extra_price: float = Field(default=0, ge=0)

    model_config = ConfigDict(str_strip_whitespace=True)


class CreateOrderItemInput(BaseModel):
    product_id: int
    quantity: int = Field(gt=0)
    selected_flavors: list[OrderItemSelectedFlavorInput] = Field(default_factory=list)


class CreateOrderRequest(BaseModel):
    order_day_id: int
    guest_data: GuestDataInput | None = None
    items: list[CreateOrderItemInput] = Field(min_length=1)


class CreateOrderResponse(BaseModel):
    id: int
    tracking_token: str
    status: OrderStatus
    total: float
    created_at: datetime | None = None

    model_config = ConfigDict(from_attributes=True)


class GuestDataTrackingResponse(BaseModel):
    name: str | None = None
    email: EmailStr | None = None
    phone: str | None = None


class OrderDayTrackingResponse(BaseModel):
    id: int
    date: date

    model_config = ConfigDict(from_attributes=True)


class OrderItemTrackingResponse(BaseModel):
    id: int
    product_id: int
    quantity: int
    selected_flavors: list[OrderItemSelectedFlavorInput] | None = None
    unit_price: float
    subtotal: float

    model_config = ConfigDict(from_attributes=True)


class OrderStatusLogTrackingResponse(BaseModel):
    id: int
    old_status: OrderStatus | None = None
    new_status: OrderStatus
    note: str | None = None
    changed_at: datetime | None = None

    model_config = ConfigDict(from_attributes=True)


class TrackOrderResponse(BaseModel):
    id: int
    tracking_token: str
    status: OrderStatus
    total: float
    created_at: datetime | None = None
    guest_data: GuestDataTrackingResponse | None = None
    order_day: OrderDayTrackingResponse
    items: list[OrderItemTrackingResponse] = Field(default_factory=list)
    status_log: list[OrderStatusLogTrackingResponse] = Field(default_factory=list)

    model_config = ConfigDict(from_attributes=True)


class MyOrderListItemResponse(BaseModel):
    id: int
    tracking_token: str
    status: OrderStatus
    total: float
    created_at: datetime | None = None
    order_day: OrderDayTrackingResponse
    items_count: int
