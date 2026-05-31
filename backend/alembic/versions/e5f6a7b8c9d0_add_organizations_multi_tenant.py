"""add organizations table for multi-tenant accounting firms

Revision ID: e5f6a7b8c9d0
Revises: d4e5f6a7b8c9
Create Date: 2026-05-30 10:00:00.000000

"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa

revision: str = 'e5f6a7b8c9d0'
down_revision: Union[str, Sequence[str], None] = 'd4e5f6a7b8c9'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        'organizations',
        sa.Column('id', sa.Integer(), primary_key=True),
        sa.Column('name', sa.String(), nullable=False),
        sa.Column('staff_code', sa.String(), nullable=False, unique=True),
    )

    # Drop the global unique constraint on company names — names are now unique per org
    op.drop_constraint('companies_name_key', 'companies', type_='unique')

    # Add organization_id to users, companies, records
    op.add_column('users',     sa.Column('organization_id', sa.Integer(), sa.ForeignKey('organizations.id'), nullable=True))
    op.add_column('companies', sa.Column('organization_id', sa.Integer(), sa.ForeignKey('organizations.id'), nullable=True))
    op.add_column('records',   sa.Column('organization_id', sa.Integer(), sa.ForeignKey('organizations.id'), nullable=True))

    # Seed a default org for any existing data
    op.execute("""
        INSERT INTO organizations (id, name, staff_code)
        SELECT 1, 'Default Organization', 'STAFF-2026'
        WHERE NOT EXISTS (SELECT 1 FROM organizations WHERE id = 1)
    """)
    op.execute("UPDATE users     SET organization_id = 1 WHERE organization_id IS NULL")
    op.execute("UPDATE companies SET organization_id = 1 WHERE organization_id IS NULL")
    op.execute("UPDATE records   SET organization_id = 1 WHERE organization_id IS NULL")


def downgrade() -> None:
    op.drop_column('records',   'organization_id')
    op.drop_column('companies', 'organization_id')
    op.drop_column('users',     'organization_id')
    op.create_unique_constraint('companies_name_key', 'companies', ['name'])
    op.drop_table('organizations')
