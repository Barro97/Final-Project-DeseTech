"""add_oauth_support_to_users

Revision ID: c15024d99ebc
Revises: dataset_location_time
Create Date: 2025-06-15 19:18:13.424545

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'c15024d99ebc'
down_revision: Union[str, None] = 'dataset_location_time'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Add OAuth provider fields
    op.add_column('users', sa.Column('oauth_provider', sa.String(50), nullable=True))
    op.add_column('users', sa.Column('oauth_id', sa.String(255), nullable=True))
    
    # Make password nullable for OAuth users
    op.alter_column('users', 'password', nullable=True)
    
    # Add index for OAuth lookups
    op.create_index('idx_users_oauth_provider_id', 'users', ['oauth_provider', 'oauth_id'])


def downgrade() -> None:
    # Remove OAuth fields and index
    op.drop_index('idx_users_oauth_provider_id', 'users')
    op.drop_column('users', 'oauth_id')
    op.drop_column('users', 'oauth_provider')
    
    # Make password required again (note: this might fail if OAuth users exist)
    op.alter_column('users', 'password', nullable=False)
