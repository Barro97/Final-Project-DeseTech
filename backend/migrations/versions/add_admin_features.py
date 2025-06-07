"""Add admin features: dataset approval and audit trail

Revision ID: add_admin_features
Revises: 1d87362ff58b
Create Date: 2024-01-01 12:00:00.000000

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision = 'add_admin_features'
down_revision = '1d87362ff58b'  # Link to initial migration
branch_labels = None
depends_on = None


def upgrade() -> None:
    # Add approval status to datasets
    op.add_column('dataset', sa.Column('approval_status', sa.String(20), nullable=False, server_default='approved'))
    op.add_column('dataset', sa.Column('approved_by', sa.Integer(), nullable=True))
    op.add_column('dataset', sa.Column('approval_date', sa.DateTime(), nullable=True))
    
    # Add foreign key constraint for approved_by
    op.create_foreign_key('fk_dataset_approved_by', 'dataset', 'users', ['approved_by'], ['user_id'])
    
    # Add user management fields
    op.add_column('users', sa.Column('status', sa.String(20), nullable=False, server_default='active'))
    op.add_column('users', sa.Column('last_login', sa.DateTime(), nullable=True))
    op.add_column('users', sa.Column('created_by', sa.Integer(), nullable=True))
    
    # Add foreign key constraint for created_by
    op.create_foreign_key('fk_users_created_by', 'users', 'users', ['created_by'], ['user_id'])
    
    # Create admin audit table
    op.create_table('admin_audit',
        sa.Column('audit_id', sa.Integer(), autoincrement=True, primary_key=True),
        sa.Column('admin_user_id', sa.Integer(), nullable=False),
        sa.Column('action_type', sa.String(50), nullable=False),
        sa.Column('target_type', sa.String(50), nullable=False),
        sa.Column('target_id', sa.Integer(), nullable=False),
        sa.Column('action_details', postgresql.JSONB(astext_type=sa.Text()), nullable=True),
        sa.Column('timestamp', sa.DateTime(), nullable=False, server_default=sa.text('CURRENT_TIMESTAMP'))
    )
    
    # Add foreign key constraint for admin audit
    op.create_foreign_key('fk_admin_audit_user', 'admin_audit', 'users', ['admin_user_id'], ['user_id'])
    
    # Add indexes for better performance
    op.create_index('idx_dataset_approval_status', 'dataset', ['approval_status'])
    op.create_index('idx_users_status', 'users', ['status'])
    op.create_index('idx_admin_audit_timestamp', 'admin_audit', ['timestamp'])
    op.create_index('idx_admin_audit_action_type', 'admin_audit', ['action_type'])


def downgrade() -> None:
    # Drop indexes
    op.drop_index('idx_admin_audit_action_type')
    op.drop_index('idx_admin_audit_timestamp')
    op.drop_index('idx_users_status')
    op.drop_index('idx_dataset_approval_status')
    
    # Drop admin audit table
    op.drop_table('admin_audit')
    
    # Remove user management fields
    op.drop_constraint('fk_users_created_by', 'users', type_='foreignkey')
    op.drop_column('users', 'created_by')
    op.drop_column('users', 'last_login')
    op.drop_column('users', 'status')
    
    # Remove dataset approval fields
    op.drop_constraint('fk_dataset_approved_by', 'dataset', type_='foreignkey')
    op.drop_column('dataset', 'approval_date')
    op.drop_column('dataset', 'approved_by')
    op.drop_column('dataset', 'approval_status') 