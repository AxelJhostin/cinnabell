from pydantic import BaseModel, ConfigDict, Field

from app.models.product import ProductCategory


class ProductFlavorResponse(BaseModel):
    id: int
    flavor_name: str
    extra_price: float

    model_config = ConfigDict(from_attributes=True)


class ProductListResponse(BaseModel):
    id: int
    name: str
    slug: str
    description: str | None = None
    price: float
    image_url: str | None = None
    category: ProductCategory

    model_config = ConfigDict(from_attributes=True)


class ProductDetailResponse(ProductListResponse):
    flavors: list[ProductFlavorResponse] = Field(default_factory=list)
