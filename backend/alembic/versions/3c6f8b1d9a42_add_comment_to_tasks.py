"""add comment to tasks

Revision ID: 3c6f8b1d9a42
Revises: 7d2f5a8e1c94
Create Date: 2026-07-21 00:00:00.000000
"""
from alembic import op
import sqlalchemy as sa


revision = '3c6f8b1d9a42'
down_revision = '7d2f5a8e1c94'
branch_labels = None
depends_on = None


def upgrade():
    op.add_column('tasks', sa.Column('comment', sa.Text(), nullable=True))


def downgrade():
    op.drop_column('tasks', 'comment')
