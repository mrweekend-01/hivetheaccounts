"""add followed to task_actions

Revision ID: 4e7a9b2f6c31
Revises: 9b1c4d7e2a63
Create Date: 2026-07-22 00:00:00.000000
"""
from alembic import op
import sqlalchemy as sa


revision = '4e7a9b2f6c31'
down_revision = '9b1c4d7e2a63'
branch_labels = None
depends_on = None


def upgrade():
    op.add_column('task_actions',
                  sa.Column('followed', sa.Boolean(), nullable=False, server_default=sa.false()))


def downgrade():
    op.drop_column('task_actions', 'followed')
