"""Make username nullable and auto-generated

Revision ID: 5de526cf06e3
Revises: 8b83f93f5196
Create Date: 2025-06-16 17:56:37.947627

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '5de526cf06e3'
down_revision: Union[str, None] = '8b83f93f5196'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Make username nullable
    op.alter_column('users', 'username',
                    existing_type=sa.VARCHAR(255),
                    nullable=True)
    
    # For existing users without username, generate one based on email
    connection = op.get_bind()
    connection.execute(sa.text("""
        UPDATE users 
        SET username = CONCAT(
            LOWER(REGEXP_REPLACE(SPLIT_PART(email, '@', 1), '[^a-zA-Z0-9]', '', 'g')),
            '_',
            user_id
        )
        WHERE username IS NULL OR username = '';
    """))


def downgrade() -> None:
    # Make username non-nullable again
    op.alter_column('users', 'username',
                    existing_type=sa.VARCHAR(255),
                    nullable=False)
