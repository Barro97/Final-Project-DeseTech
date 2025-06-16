"""Add cover_photo_key to dataset table

Revision ID: 20241230_add_cover_photo_key
Revises: c15024d99ebc
Create Date: 2024-12-30

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = '20241230_add_cover_photo_key'
down_revision = 'c15024d99ebc'
branch_labels = None
depends_on = None


def upgrade():
    # Add cover_photo_key column to dataset table
    op.add_column('dataset', sa.Column('cover_photo_key', sa.String(length=500), nullable=True))


def downgrade():
    # Remove cover_photo_key column from dataset table
    op.drop_column('dataset', 'cover_photo_key') 