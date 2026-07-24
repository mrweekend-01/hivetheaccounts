"""add reports table and tasks.report_id

Revision ID: 1e5f8c3a2d94
Revises: 9d4e2a7f5c18
Create Date: 2026-07-24 00:00:00.000000
"""
from alembic import op
import sqlalchemy as sa


revision = '1e5f8c3a2d94'
down_revision = '9d4e2a7f5c18'
branch_labels = None
depends_on = None


def upgrade():
    op.create_table('reports',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('name', sa.String(length=120), nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=True),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('name'),
    )
    op.add_column('tasks', sa.Column('report_id', sa.Integer(), nullable=True))
    op.create_foreign_key('tasks_report_id_fkey', 'tasks', 'reports',
                          ['report_id'], ['id'], ondelete='SET NULL')


def downgrade():
    op.drop_constraint('tasks_report_id_fkey', 'tasks', type_='foreignkey')
    op.drop_column('tasks', 'report_id')
    op.drop_table('reports')
