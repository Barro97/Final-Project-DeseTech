"""add dataset location and time fields

Revision ID: dataset_location_time
Revises: 1980940df6d4
Create Date: 2025-01-15 16:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'dataset_location_time'
down_revision: Union[str, None] = '1980940df6d4'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Add geographic location and data time period fields to dataset table
    op.add_column('dataset', sa.Column('geographic_location', sa.Text(), nullable=True))
    op.add_column('dataset', sa.Column('data_time_period', sa.String(100), nullable=True))


def downgrade() -> None:
    # Remove the added fields
    op.drop_column('dataset', 'data_time_period')
    op.drop_column('dataset', 'geographic_location') 