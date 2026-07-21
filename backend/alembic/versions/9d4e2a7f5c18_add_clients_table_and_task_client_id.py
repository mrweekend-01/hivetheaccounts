"""add clients table and tasks.client_id

Revision ID: 9d4e2a7f5c18
Revises: 7a1e4f9c2d63
Create Date: 2026-07-21 00:00:00.000000
"""
from alembic import op
import sqlalchemy as sa


revision = '9d4e2a7f5c18'
down_revision = '7a1e4f9c2d63'
branch_labels = None
depends_on = None


def upgrade():
    op.create_table('clients',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('name', sa.String(length=120), nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=True),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('name'),
    )
    op.add_column('tasks', sa.Column('client_id', sa.Integer(), nullable=True))
    op.create_foreign_key('tasks_client_id_fkey', 'tasks', 'clients',
                          ['client_id'], ['id'], ondelete='SET NULL')


def downgrade():
    op.drop_constraint('tasks_client_id_fkey', 'tasks', type_='foreignkey')
    op.drop_column('tasks', 'client_id')
    op.drop_table('clients')
