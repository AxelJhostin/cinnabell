from sqlalchemy import Column, Integer, String, Numeric, Boolean, Enum, ForeignKey
from sqlalchemy.orm import relationship
from app.core.database import Base
import enum

class ProductCategory(str, enum.Enum):
    individual = "individual"
    especial = "especial"
    box = "box"

class Product(Base):
    __tablename__ = "products"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    slug = Column(String, unique=True, index=True, nullable=False)
    description = Column(String, nullable=True)
    price = Column(Numeric(10, 2), nullable=False)
    image_url = Column(String, nullable=True)
    category = Column(Enum(ProductCategory), nullable=False)
    is_active = Column(Boolean, default=True)

    flavors = relationship("ProductFlavor", back_populates="product")
    order_items = relationship("OrderItem", back_populates="product")

class ProductFlavor(Base):
    __tablename__ = "product_flavors"

    id = Column(Integer, primary_key=True, index=True)
    product_id = Column(Integer, ForeignKey("products.id"), nullable=False)
    flavor_name = Column(String, nullable=False)
    extra_price = Column(Numeric(10, 2), default=0.0)

    product = relationship("Product", back_populates="flavors")
