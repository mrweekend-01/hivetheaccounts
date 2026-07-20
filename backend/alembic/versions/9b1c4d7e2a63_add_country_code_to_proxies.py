"""add country_code to proxies

Revision ID: 9b1c4d7e2a63
Revises: 6a3e8f2c1b57
Create Date: 2026-07-21 00:00:00.000000
"""
from alembic import op
import sqlalchemy as sa


revision = '9b1c4d7e2a63'
down_revision = '6a3e8f2c1b57'
branch_labels = None
depends_on = None


def upgrade():
    op.add_column('proxies', sa.Column('country_code', sa.String(length=2), nullable=True))


def downgrade():
    op.drop_column('proxies', 'country_code')
