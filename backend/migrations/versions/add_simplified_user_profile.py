"""Add simplified user profile columns to users table

Revision ID: add_simplified_user_profile
Revises: 1ca5b594431e
Create Date: 2025-01-15 14:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql


# revision identifiers, used by Alembic.
revision: str = 'add_simplified_user_profile'
down_revision: Union[str, None] = '1ca5b594431e'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Add profile columns to users table using simplified JSON approach
    op.add_column('users', sa.Column('title', sa.String(255), nullable=True))
    op.add_column('users', sa.Column('bio', sa.Text(), nullable=True))
    op.add_column('users', sa.Column('about_me', sa.Text(), nullable=True))
    op.add_column('users', sa.Column('cover_photo_url', sa.Text(), nullable=True))
    op.add_column('users', sa.Column('skills', postgresql.JSONB(), nullable=True))
    op.add_column('users', sa.Column('projects', postgresql.JSONB(), nullable=True))
    op.add_column('users', sa.Column('contact_info', postgresql.JSONB(), nullable=True))
    op.add_column('users', sa.Column('privacy_level', sa.String(20), nullable=False, server_default='public'))
    op.add_column('users', sa.Column('profile_completion_percentage', sa.Integer(), nullable=False, server_default='0'))
    
    # Add indexes for better performance
    op.create_index('idx_users_privacy_level', 'users', ['privacy_level'])
    # JSONB indexes for commonly queried fields
    op.execute("CREATE INDEX idx_users_skills_gin ON users USING GIN (skills)")
    op.execute("CREATE INDEX idx_users_projects_gin ON users USING GIN (projects)")
    op.execute("CREATE INDEX idx_users_contact_info_gin ON users USING GIN (contact_info)")


def downgrade() -> None:
    # Drop indexes
    op.execute("DROP INDEX IF EXISTS idx_users_contact_info_gin")
    op.execute("DROP INDEX IF EXISTS idx_users_projects_gin")
    op.execute("DROP INDEX IF EXISTS idx_users_skills_gin")
    op.drop_index('idx_users_privacy_level', table_name='users')
    
    # Drop profile columns
    op.drop_column('users', 'profile_completion_percentage')
    op.drop_column('users', 'privacy_level')
    op.drop_column('users', 'contact_info')
    op.drop_column('users', 'projects')
    op.drop_column('users', 'skills')
    op.drop_column('users', 'cover_photo_url')
    op.drop_column('users', 'about_me')
    op.drop_column('users', 'bio')
    op.drop_column('users', 'title') 