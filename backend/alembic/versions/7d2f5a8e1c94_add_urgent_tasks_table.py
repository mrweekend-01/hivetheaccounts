"""add urgent_tasks table (kanban board for admins)

Revision ID: 7d2f5a8e1c94
Revises: 4e7a9b2f6c31
Create Date: 2026-07-22 00:00:00.000000
"""
from alembic import op
import sqlalchemy as sa


revision = '7d2f5a8e1c94'
down_revision = '4e7a9b2f6c31'
branch_labels = None
depends_on = None


def upgrade():
    op.create_table('urgent_tasks',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('title', sa.String(length=200), nullable=False),
        sa.Column('description', sa.Text(), nullable=True),
        sa.Column('priority', sa.Enum('baja', 'media', 'alta', name='urgent_priority'),
                  nullable=False, server_default='media'),
        sa.Column('status', sa.Enum('no_arrancada', 'en_proceso', 'finalizada', name='urgent_status'),
                  nullable=False, server_default='no_arrancada'),
        sa.Column('assigned_to', sa.Integer(), nullable=True),
        sa.Column('created_by', sa.Integer(), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=True),
        sa.Column('updated_at', sa.DateTime(timezone=True), nullable=True),
        sa.Column('finished_at', sa.DateTime(timezone=True), nullable=True),
        sa.ForeignKeyConstraint(['assigned_to'], ['users.id'], ondelete='SET NULL'),
        sa.ForeignKeyConstraint(['created_by'], ['users.id'], ondelete='SET NULL'),
        sa.PrimaryKeyConstraint('id'),
    )


def downgrade():
    op.drop_table('urgent_tasks')
    op.execute("DROP TYPE IF EXISTS urgent_priority")
    op.execute("DROP TYPE IF EXISTS urgent_status")
