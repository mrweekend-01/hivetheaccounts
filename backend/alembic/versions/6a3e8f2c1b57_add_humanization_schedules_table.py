"""add humanization_schedules table

Revision ID: 6a3e8f2c1b57
Revises: 2f7c9a1e6d84
Create Date: 2026-07-20 00:00:00.000000
"""
from alembic import op
import sqlalchemy as sa


revision = '6a3e8f2c1b57'
down_revision = '2f7c9a1e6d84'
branch_labels = None
depends_on = None


def upgrade():
    op.create_table('humanization_schedules',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('social_account_id', sa.Integer(), nullable=False),
        sa.Column('time_of_day', sa.Time(), nullable=False),
        sa.Column('days_of_week', sa.String(length=20), nullable=True),
        sa.Column('active', sa.Boolean(), nullable=False, server_default=sa.true()),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=True),
        sa.ForeignKeyConstraint(['social_account_id'], ['social_accounts.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id'),
    )
    op.create_index(op.f('ix_humanization_schedules_social_account_id'),
                    'humanization_schedules', ['social_account_id'], unique=False)


def downgrade():
    op.drop_index(op.f('ix_humanization_schedules_social_account_id'), table_name='humanization_schedules')
    op.drop_table('humanization_schedules')
