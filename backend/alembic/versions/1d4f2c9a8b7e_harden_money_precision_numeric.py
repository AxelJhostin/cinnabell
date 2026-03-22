"""harden money precision numeric

Revision ID: 1d4f2c9a8b7e
Revises: f7ba57339e52
Create Date: 2026-03-22 00:00:00.000000
"""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = "1d4f2c9a8b7e"
down_revision: Union[str, Sequence[str], None] = "f7ba57339e52"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.alter_column(
        "products",
        "price",
        existing_type=sa.Float(),
        type_=sa.Numeric(10, 2),
        existing_nullable=False,
        postgresql_using="price::numeric(10,2)",
    )
    op.alter_column(
        "product_flavors",
        "extra_price",
        existing_type=sa.Float(),
        type_=sa.Numeric(10, 2),
        existing_nullable=True,
        postgresql_using="extra_price::numeric(10,2)",
    )
    op.alter_column(
        "orders",
        "total",
        existing_type=sa.Float(),
        type_=sa.Numeric(10, 2),
        existing_nullable=False,
        postgresql_using="total::numeric(10,2)",
    )
    op.alter_column(
        "order_items",
        "unit_price",
        existing_type=sa.Float(),
        type_=sa.Numeric(10, 2),
        existing_nullable=False,
        postgresql_using="unit_price::numeric(10,2)",
    )
    op.alter_column(
        "order_items",
        "subtotal",
        existing_type=sa.Float(),
        type_=sa.Numeric(10, 2),
        existing_nullable=False,
        postgresql_using="subtotal::numeric(10,2)",
    )


def downgrade() -> None:
    op.alter_column(
        "order_items",
        "subtotal",
        existing_type=sa.Numeric(10, 2),
        type_=sa.Float(),
        existing_nullable=False,
        postgresql_using="subtotal::double precision",
    )
    op.alter_column(
        "order_items",
        "unit_price",
        existing_type=sa.Numeric(10, 2),
        type_=sa.Float(),
        existing_nullable=False,
        postgresql_using="unit_price::double precision",
    )
    op.alter_column(
        "orders",
        "total",
        existing_type=sa.Numeric(10, 2),
        type_=sa.Float(),
        existing_nullable=False,
        postgresql_using="total::double precision",
    )
    op.alter_column(
        "product_flavors",
        "extra_price",
        existing_type=sa.Numeric(10, 2),
        type_=sa.Float(),
        existing_nullable=True,
        postgresql_using="extra_price::double precision",
    )
    op.alter_column(
        "products",
        "price",
        existing_type=sa.Numeric(10, 2),
        type_=sa.Float(),
        existing_nullable=False,
        postgresql_using="price::double precision",
    )
