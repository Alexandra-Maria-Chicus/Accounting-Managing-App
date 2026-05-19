"""add auth_tokens table

Revision ID: a1b2c3d4e5f6
Revises: f1a2b3c4d5e6
Create Date: 2026-05-19 10:00:00.000000

"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa

revision: str = 'a1b2c3d4e5f6'
down_revision: Union[str, Sequence[str], None] = 'f1a2b3c4d5e6'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        'auth_tokens',
        sa.Column('id',         sa.Integer(),  nullable=False),
        sa.Column('token',      sa.String(),   nullable=False),
        sa.Column('user_id',    sa.Integer(),  nullable=True),
        sa.Column('email',      sa.String(),   nullable=False),
        sa.Column('type',       sa.String(),   nullable=False),
        sa.Column('expires_at', sa.DateTime(), nullable=False),
        sa.Column('used',       sa.Boolean(),  nullable=True),
        sa.Column('created_at', sa.DateTime(), nullable=True),
        sa.ForeignKeyConstraint(['user_id'], ['users.id']),
        sa.PrimaryKeyConstraint('id'),
    )
    op.create_index('ix_auth_tokens_token', 'auth_tokens', ['token'], unique=True)


def downgrade() -> None:
    op.drop_index('ix_auth_tokens_token', table_name='auth_tokens')
    op.drop_table('auth_tokens')
