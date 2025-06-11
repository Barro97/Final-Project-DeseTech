"""Add user profile system with privacy controls

Revision ID: add_user_profile_system
Revises: 1ca5b594431e
Create Date: 2025-01-15 12:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'add_user_profile_system'
down_revision: Union[str, None] = '1ca5b594431e'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Create user_profiles table for extended profile information
    op.create_table('user_profiles',
        sa.Column('user_id', sa.Integer(), nullable=False),
        sa.Column('bio', sa.Text(), nullable=True),
        sa.Column('about_me', sa.Text(), nullable=True),
        sa.Column('title', sa.String(255), nullable=True),
        sa.Column('cover_photo_url', sa.Text(), nullable=True),
        sa.Column('profile_completion_percentage', sa.Integer(), nullable=False, server_default='0'),
        sa.Column('privacy_level', sa.String(20), nullable=False, server_default='public'),
        sa.Column('created_at', sa.DateTime(), nullable=False, server_default=sa.text('CURRENT_TIMESTAMP')),
        sa.Column('updated_at', sa.DateTime(), nullable=False, server_default=sa.text('CURRENT_TIMESTAMP')),
        sa.ForeignKeyConstraint(['user_id'], ['users.user_id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('user_id')
    )

    # Create user_skills table for skills with categories
    op.create_table('user_skills',
        sa.Column('skill_id', sa.Integer(), autoincrement=True, nullable=False),
        sa.Column('user_id', sa.Integer(), nullable=False),
        sa.Column('skill_name', sa.String(255), nullable=False),
        sa.Column('category', sa.String(100), nullable=True),
        sa.Column('is_visible', sa.Boolean(), nullable=False, server_default='true'),
        sa.Column('display_order', sa.Integer(), nullable=True),
        sa.Column('created_at', sa.DateTime(), nullable=False, server_default=sa.text('CURRENT_TIMESTAMP')),
        sa.ForeignKeyConstraint(['user_id'], ['users.user_id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('skill_id')
    )

    # Create user_projects table for projects/publications
    op.create_table('user_projects',
        sa.Column('project_id', sa.Integer(), autoincrement=True, nullable=False),
        sa.Column('user_id', sa.Integer(), nullable=False),
        sa.Column('name', sa.String(255), nullable=False),
        sa.Column('description', sa.Text(), nullable=True),
        sa.Column('link', sa.Text(), nullable=True),
        sa.Column('is_visible', sa.Boolean(), nullable=False, server_default='true'),
        sa.Column('display_order', sa.Integer(), nullable=True),
        sa.Column('created_at', sa.DateTime(), nullable=False, server_default=sa.text('CURRENT_TIMESTAMP')),
        sa.ForeignKeyConstraint(['user_id'], ['users.user_id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('project_id')
    )

    # Create user_contacts table for contact information with privacy controls
    op.create_table('user_contacts',
        sa.Column('user_id', sa.Integer(), nullable=False),
        sa.Column('linkedin', sa.String(255), nullable=True),
        sa.Column('twitter', sa.String(255), nullable=True),
        sa.Column('orcid', sa.String(255), nullable=True),
        sa.Column('personal_email', sa.String(255), nullable=True),
        sa.Column('show_email', sa.Boolean(), nullable=False, server_default='false'),
        sa.Column('show_linkedin', sa.Boolean(), nullable=False, server_default='true'),
        sa.Column('show_twitter', sa.Boolean(), nullable=False, server_default='true'),
        sa.Column('show_orcid', sa.Boolean(), nullable=False, server_default='true'),
        sa.Column('created_at', sa.DateTime(), nullable=False, server_default=sa.text('CURRENT_TIMESTAMP')),
        sa.Column('updated_at', sa.DateTime(), nullable=False, server_default=sa.text('CURRENT_TIMESTAMP')),
        sa.ForeignKeyConstraint(['user_id'], ['users.user_id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('user_id')
    )

    # Add indexes for better performance
    op.create_index('idx_user_profiles_privacy_level', 'user_profiles', ['privacy_level'])
    op.create_index('idx_user_skills_user_id', 'user_skills', ['user_id'])
    op.create_index('idx_user_skills_category', 'user_skills', ['category'])
    op.create_index('idx_user_skills_visible', 'user_skills', ['is_visible'])
    op.create_index('idx_user_projects_user_id', 'user_projects', ['user_id'])
    op.create_index('idx_user_projects_visible', 'user_projects', ['is_visible'])


def downgrade() -> None:
    # Drop indexes
    op.drop_index('idx_user_projects_visible', table_name='user_projects')
    op.drop_index('idx_user_projects_user_id', table_name='user_projects')
    op.drop_index('idx_user_skills_visible', table_name='user_skills')
    op.drop_index('idx_user_skills_category', table_name='user_skills')
    op.drop_index('idx_user_skills_user_id', table_name='user_skills')
    op.drop_index('idx_user_profiles_privacy_level', table_name='user_profiles')
    
    # Drop tables
    op.drop_table('user_contacts')
    op.drop_table('user_projects')
    op.drop_table('user_skills')
    op.drop_table('user_profiles') 