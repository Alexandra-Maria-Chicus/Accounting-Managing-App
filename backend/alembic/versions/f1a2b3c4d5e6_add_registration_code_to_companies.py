"""add registration_code to companies

Revision ID: f1a2b3c4d5e6
Revises: bcff76d209c7
Create Date: 2026-05-18 10:00:00.000000

"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa

revision: str = 'f1a2b3c4d5e6'
down_revision: Union[str, Sequence[str], None] = 'bcff76d209c7'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column('companies',
        sa.Column('registration_code', sa.String(), nullable=True)
    )
    op.create_unique_constraint(
        'uq_companies_registration_code',
        'companies',
        ['registration_code']
    )


def downgrade() -> None:
    op.drop_constraint(
        'uq_companies_registration_code',
        'companies',
        type_='unique'
    )
    op.drop_column('companies', 'registration_code')
