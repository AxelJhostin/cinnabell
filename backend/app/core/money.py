from decimal import Decimal, ROUND_HALF_UP
from typing import Any

MONEY_ZERO = Decimal("0.00")
MONEY_QUANTIZER = Decimal("0.01")


def to_decimal(value: Any) -> Decimal:
    if value is None:
        return MONEY_ZERO
    if isinstance(value, Decimal):
        return value
    return Decimal(str(value))


def quantize_money(value: Any) -> Decimal:
    return to_decimal(value).quantize(MONEY_QUANTIZER, rounding=ROUND_HALF_UP)


def to_money_float(value: Any) -> float:
    return float(quantize_money(value))
