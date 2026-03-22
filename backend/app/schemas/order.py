from datetime import datetime

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
    guest_data: GuestDataInput
    items: list[CreateOrderItemInput] = Field(min_length=1)


class CreateOrderResponse(BaseModel):
    id: int
    tracking_token: str
    status: OrderStatus
    total: float
    created_at: datetime | None = None

    model_config = ConfigDict(from_attributes=True)
