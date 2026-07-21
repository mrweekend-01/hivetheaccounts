"""add force_completed to tasks

Revision ID: 7a1e4f9c2d63
Revises: 3c6f8b1d9a42
Create Date: 2026-07-21 00:00:00.000000
"""
from alembic import op
import sqlalchemy as sa


revision = '7a1e4f9c2d63'
down_revision = '3c6f8b1d9a42'
branch_labels = None
depends_on = None


def upgrade():
    op.add_column('tasks',
                  sa.Column('force_completed', sa.Boolean(), nullable=False, server_default=sa.false()))


def downgrade():
    op.drop_column('tasks', 'force_completed')
