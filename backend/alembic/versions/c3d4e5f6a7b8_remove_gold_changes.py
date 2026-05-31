"""remove gold changes

Revision ID: c3d4e5f6a7b8
Revises: b2c3d4e5f6a7
Create Date: 2026-05-20 10:00:00.000000

"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa

revision: str = 'c3d4e5f6a7b8'
down_revision: Union[str, Sequence[str], None] = 'b2c3d4e5f6a7'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Remove ai_explanation column from suspicious_users
    op.drop_column('suspicious_users', 'ai_explanation')

    # Remove indexes added for gold analytics
    op.drop_index('ix_records_year_month',  table_name='records')
    op.drop_index('ix_records_company_id',  table_name='records')
    op.drop_index('ix_records_employee',    table_name='records')
    op.drop_index('ix_records_status',      table_name='records')
    op.drop_index('ix_records_period_year', table_name='records')
    op.drop_index('ix_records_period_month',table_name='records')


def downgrade() -> None:
    # Restore gold changes if needed
    op.add_column('suspicious_users',
        sa.Column('ai_explanation', sa.String(), nullable=True)
    )
    op.create_index('ix_records_period_month', 'records', ['period_month'])
    op.create_index('ix_records_period_year',  'records', ['period_year'])
    op.create_index('ix_records_status',       'records', ['status'])
    op.create_index('ix_records_employee',     'records', ['employee'])
    op.create_index('ix_records_company_id',   'records', ['company_id'])
    op.create_index('ix_records_year_month',   'records', ['period_year', 'period_month'])
