"""add indexes to records and ai_explanation to suspicious_users

Revision ID: b2c3d4e5f6a7
Revises: a1b2c3d4e5f6
Create Date: 2026-05-19 12:00:00.000000

"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa

revision: str = 'b2c3d4e5f6a7'
down_revision: Union[str, Sequence[str], None] = 'a1b2c3d4e5f6'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column('suspicious_users',
        sa.Column('ai_explanation', sa.String(), nullable=True)
    )
    op.create_index('ix_records_period_month',  'records', ['period_month'])
    op.create_index('ix_records_period_year',   'records', ['period_year'])
    op.create_index('ix_records_status',        'records', ['status'])
    op.create_index('ix_records_employee',      'records', ['employee'])
    op.create_index('ix_records_company_id',    'records', ['company_id'])
    op.create_index('ix_records_year_month',    'records', ['period_year', 'period_month'])


def downgrade() -> None:
    op.drop_index('ix_records_year_month',   table_name='records')
    op.drop_index('ix_records_company_id',   table_name='records')
    op.drop_index('ix_records_employee',     table_name='records')
    op.drop_index('ix_records_status',       table_name='records')
    op.drop_index('ix_records_period_year',  table_name='records')
    op.drop_index('ix_records_period_month', table_name='records')
    op.drop_column('suspicious_users', 'ai_explanation')
