"""Add user download tracking table

Revision ID: 1ca5b594431e
Revises: add_admin_features
Create Date: 2025-06-07 15:02:03.617389

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '1ca5b594431e'
down_revision: Union[str, None] = 'add_admin_features'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Create user_downloads table for tracking unique user downloads
    op.create_table('user_downloads',
        sa.Column('download_id', sa.Integer(), autoincrement=True, primary_key=True),
        sa.Column('user_id', sa.Integer(), nullable=False),
        sa.Column('dataset_id', sa.Integer(), nullable=False),
        sa.Column('first_download_date', sa.DateTime(), nullable=False, server_default=sa.text('CURRENT_TIMESTAMP')),
        sa.Column('last_download_date', sa.DateTime(), nullable=False, server_default=sa.text('CURRENT_TIMESTAMP')),
        sa.Column('download_type', sa.String(20), nullable=False),
        sa.Column('file_id', sa.Integer(), nullable=True),
        sa.Column('total_download_count', sa.Integer(), nullable=False, server_default=sa.text('1')),
        
        # Foreign key constraints
        sa.ForeignKeyConstraint(['user_id'], ['users.user_id']),
        sa.ForeignKeyConstraint(['dataset_id'], ['dataset.dataset_id']),
        sa.ForeignKeyConstraint(['file_id'], ['files.file_id']),
        
        # Unique constraint to ensure one record per user per dataset
        sa.UniqueConstraint('user_id', 'dataset_id', name='uq_user_dataset_download')
    )
    
    # Add indexes for better performance
    op.create_index('idx_user_downloads_user_id', 'user_downloads', ['user_id'])
    op.create_index('idx_user_downloads_dataset_id', 'user_downloads', ['dataset_id'])
    op.create_index('idx_user_downloads_date', 'user_downloads', ['first_download_date'])


def downgrade() -> None:
    # Drop indexes
    op.drop_index('idx_user_downloads_date', table_name='user_downloads')
    op.drop_index('idx_user_downloads_dataset_id', table_name='user_downloads')
    op.drop_index('idx_user_downloads_user_id', table_name='user_downloads')
    
    # Drop user_downloads table
    op.drop_table('user_downloads')
