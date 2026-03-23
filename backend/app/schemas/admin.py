from datetime import date, datetime

from pydantic import BaseModel, ConfigDict, EmailStr, Field, model_validator

from app.models.order import OrderStatus
from app.models.product import ProductCategory


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


class AdminOrderDayManagementResponse(BaseModel):
    id: int
    date: date
    is_open: bool
    max_capacity: int
    current_orders: int
    is_special: bool
    note: str | None = None
    available_slots: int


class AdminOrderDayUpdateRequest(BaseModel):
    is_open: bool | None = None
    max_capacity: int | None = Field(default=None, ge=0)
    is_special: bool | None = None
    note: str | None = Field(default=None, max_length=255)

    model_config = ConfigDict(str_strip_whitespace=True)

    @model_validator(mode="after")
    def validate_at_least_one_field(self) -> "AdminOrderDayUpdateRequest":
        if not self.model_fields_set:
            raise ValueError("Debes enviar al menos un campo para actualizar")
        return self


class AdminOrderDayCreateRequest(BaseModel):
    date: date
    is_open: bool = True
    max_capacity: int = Field(default=30, ge=0)
    is_special: bool = False
    note: str | None = Field(default=None, max_length=255)

    model_config = ConfigDict(str_strip_whitespace=True)

    @model_validator(mode="after")
    def validate_open_day_capacity(self) -> "AdminOrderDayCreateRequest":
        if self.is_open and self.max_capacity <= 0:
            raise ValueError("Un dia abierto debe tener capacidad mayor a 0")
        return self


class AdminProductManagementResponse(BaseModel):
    id: int
    name: str
    slug: str
    description: str | None = None
    price: float
    image_url: str | None = None
    category: ProductCategory
    is_active: bool

    model_config = ConfigDict(from_attributes=True)


class AdminProductUpdateRequest(BaseModel):
    description: str | None = Field(default=None, max_length=500)
    price: float | None = Field(default=None, ge=0)
    image_url: str | None = Field(default=None, max_length=500)
    is_active: bool | None = None

    model_config = ConfigDict(str_strip_whitespace=True)

    @model_validator(mode="after")
    def validate_at_least_one_field(self) -> "AdminProductUpdateRequest":
        if not self.model_fields_set:
            raise ValueError("Debes enviar al menos un campo para actualizar")
        return self


class AdminCustomerListItemResponse(BaseModel):
    id: int
    name: str
    email: str
    phone: str | None = None
    created_at: datetime | None = None
    orders_count: int
    total_spent: float
    last_order_date: datetime | None = None


class AdminReportSummaryResponse(BaseModel):
    total_orders: int
    total_revenue: float
    average_order_value: float
    orders_today: int
    revenue_today: float
