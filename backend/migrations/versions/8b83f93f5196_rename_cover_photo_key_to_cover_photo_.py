"""rename cover_photo_key to cover_photo_url

Revision ID: 8b83f93f5196
Revises: 20241230_add_cover_photo_key
Create Date: 2025-06-16 15:09:23.254086

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '8b83f93f5196'
down_revision: Union[str, None] = '20241230_add_cover_photo_key'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Rename cover_photo_key column to cover_photo_url in dataset table using raw SQL
    op.execute('ALTER TABLE dataset RENAME COLUMN cover_photo_key TO cover_photo_url')


def downgrade() -> None:
    # Rename cover_photo_url column back to cover_photo_key in dataset table using raw SQL
    op.execute('ALTER TABLE dataset RENAME COLUMN cover_photo_url TO cover_photo_key')
