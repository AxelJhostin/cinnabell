"""add product_name snapshot to order_items

Revision ID: 9c3b5d2f1aab
Revises: 1d4f2c9a8b7e
Create Date: 2026-03-22 00:00:00.000000
"""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = "9c3b5d2f1aab"
down_revision: Union[str, Sequence[str], None] = "1d4f2c9a8b7e"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column("order_items", sa.Column("product_name", sa.String(), nullable=True))
    op.execute(
        """
        UPDATE order_items
        SET product_name = (
            SELECT products.name
            FROM products
            WHERE products.id = order_items.product_id
        )
        WHERE product_name IS NULL
        """
    )


def downgrade() -> None:
    op.drop_column("order_items", "product_name")
