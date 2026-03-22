from datetime import date

from pydantic import BaseModel


class AdminDashboardSummaryResponse(BaseModel):
    today_date: date
    today_orders_count: int
    today_remaining_capacity: int
    today_revenue: float
