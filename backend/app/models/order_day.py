from sqlalchemy import Column, Integer, Date, Boolean, String
from sqlalchemy.orm import relationship
from app.core.database import Base

class OrderDay(Base):
    __tablename__ = "order_days"

    id = Column(Integer, primary_key=True, index=True)
    date = Column(Date, unique=True, index=True, nullable=False)
    is_open = Column(Boolean, default=True)
    max_capacity = Column(Integer, default=30)
    current_orders = Column(Integer, default=0)
    is_special = Column(Boolean, default=False)
    note = Column(String, nullable=True)

    orders = relationship("Order", back_populates="order_day")