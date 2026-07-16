"""add humanization_duration_minutes to social_accounts

Revision ID: 9f21b6b3a2d4
Revises: 4b196624f7c8
Create Date: 2026-07-15 16:41:30.000000
"""
from alembic import op
import sqlalchemy as sa


revision = '9f21b6b3a2d4'
down_revision = '4b196624f7c8'
branch_labels = None
depends_on = None


def upgrade():
    op.add_column('social_accounts', sa.Column('humanization_duration_minutes', sa.Integer(), nullable=True))


def downgrade():
    op.drop_column('social_accounts', 'humanization_duration_minutes')
