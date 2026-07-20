"""add description, connection_schedule, followed_profiles to accounts

Revision ID: 8d4f1c6a3b92
Revises: 5e8a1d3f9c62
Create Date: 2026-07-20 00:00:00.000000
"""
from alembic import op
import sqlalchemy as sa


revision = '8d4f1c6a3b92'
down_revision = '5e8a1d3f9c62'
branch_labels = None
depends_on = None


def upgrade():
    op.add_column('accounts', sa.Column('description', sa.Text(), nullable=True))
    op.add_column('accounts', sa.Column('connection_schedule', sa.JSON(), nullable=True))
    op.add_column('accounts', sa.Column('followed_profiles', sa.JSON(), nullable=True))


def downgrade():
    op.drop_column('accounts', 'followed_profiles')
    op.drop_column('accounts', 'connection_schedule')
    op.drop_column('accounts', 'description')
