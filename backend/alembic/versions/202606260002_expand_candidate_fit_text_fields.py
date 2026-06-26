"""expand candidate fit text fields

Revision ID: 202606260002
Revises: 202606260001
Create Date: 2026-06-26 00:02:00.000000
"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = "202606260002"
down_revision: Union[str, None] = "202606260001"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.alter_column(
        "candidates",
        "fit_summary",
        existing_type=sa.String(length=255),
        type_=sa.Text(),
        existing_nullable=True,
    )
    op.alter_column(
        "candidates",
        "fit_explanation",
        existing_type=sa.String(length=255),
        type_=sa.Text(),
        existing_nullable=True,
    )


def downgrade() -> None:
    op.alter_column(
        "candidates",
        "fit_explanation",
        existing_type=sa.Text(),
        type_=sa.String(length=255),
        existing_nullable=True,
    )
    op.alter_column(
        "candidates",
        "fit_summary",
        existing_type=sa.Text(),
        type_=sa.String(length=255),
        existing_nullable=True,
    )
