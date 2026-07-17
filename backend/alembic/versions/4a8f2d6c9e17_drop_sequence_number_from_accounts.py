"""drop sequence_number from accounts

Revision ID: 4a8f2d6c9e17
Revises: 7b1e4c9a2f31
Create Date: 2026-07-17 00:00:00.000000
"""
from alembic import op
import sqlalchemy as sa


revision = '4a8f2d6c9e17'
down_revision = '7b1e4c9a2f31'
branch_labels = None
depends_on = None


def upgrade():
    op.drop_column('accounts', 'sequence_number')


def downgrade():
    op.add_column('accounts', sa.Column('sequence_number', sa.Integer(), nullable=True))
