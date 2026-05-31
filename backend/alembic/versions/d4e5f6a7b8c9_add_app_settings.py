"""add app_settings table for dynamic staff registration code

Revision ID: d4e5f6a7b8c9
Revises: c3d4e5f6a7b8
Create Date: 2026-05-29 12:00:00.000000

"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa

revision: str = 'd4e5f6a7b8c9'
down_revision: Union[str, Sequence[str], None] = 'c3d4e5f6a7b8'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        'app_settings',
        sa.Column('id', sa.Integer(), primary_key=True),
        sa.Column('staff_registration_code', sa.String(), nullable=False, server_default='STAFF-2026'),
    )
    op.execute("INSERT INTO app_settings (id, staff_registration_code) VALUES (1, 'STAFF-2026')")


def downgrade() -> None:
    op.drop_table('app_settings')
