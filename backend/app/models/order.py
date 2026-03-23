from sqlalchemy import Column, Integer, String, Numeric, DateTime, ForeignKey, Enum, JSON
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.core.database import Base
import enum

class OrderStatus(str, enum.Enum):
    pendiente = "PENDIENTE"
    confirmado = "CONFIRMADO"
    en_preparacion = "EN_PREPARACION"
    listo = "LISTO"
    entregado = "ENTREGADO"
    cancelado = "CANCELADO"

class Order(Base):
    __tablename__ = "orders"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    guest_data = Column(JSON, nullable=True)
    order_day_id = Column(Integer, ForeignKey("order_days.id"), nullable=False)
    status = Column(Enum(OrderStatus), default=OrderStatus.pendiente, nullable=False)
    total = Column(Numeric(10, 2), nullable=False)
    tracking_token = Column(String, unique=True, index=True, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    user = relationship("User", back_populates="orders")
    order_day = relationship("OrderDay", back_populates="orders")
    items = relationship("OrderItem", back_populates="order")
    status_log = relationship("OrderStatusLog", back_populates="order")

class OrderItem(Base):
    __tablename__ = "order_items"

    id = Column(Integer, primary_key=True, index=True)
    order_id = Column(Integer, ForeignKey("orders.id"), nullable=False)
    product_id = Column(Integer, ForeignKey("products.id"), nullable=False)
    product_name = Column(String, nullable=True)
    quantity = Column(Integer, nullable=False)
    selected_flavors = Column(JSON, nullable=True)
    unit_price = Column(Numeric(10, 2), nullable=False)
    subtotal = Column(Numeric(10, 2), nullable=False)

    order = relationship("Order", back_populates="items")
    product = relationship("Product", back_populates="order_items")

class OrderStatusLog(Base):
    __tablename__ = "order_status_log"

    id = Column(Integer, primary_key=True, index=True)
    order_id = Column(Integer, ForeignKey("orders.id"), nullable=False)
    old_status = Column(Enum(OrderStatus), nullable=True)
    new_status = Column(Enum(OrderStatus), nullable=False)
    note = Column(String, nullable=True)
    changed_at = Column(DateTime(timezone=True), server_default=func.now())

    order = relationship("Order", back_populates="status_log")
