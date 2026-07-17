"""add tasks and task_actions tables

Revision ID: c3f7a9e21b56
Revises: 9f21b6b3a2d4
Create Date: 2026-07-17 00:00:00.000000
"""
from alembic import op
import sqlalchemy as sa


revision = 'c3f7a9e21b56'
down_revision = '9f21b6b3a2d4'
branch_labels = None
depends_on = None


def upgrade():
    op.create_table('tasks',
    sa.Column('id', sa.Integer(), nullable=False),
    sa.Column('link', sa.Text(), nullable=False),
    sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=True),
    sa.Column('saved_at', sa.DateTime(timezone=True), nullable=True),
    sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_tasks_id'), 'tasks', ['id'], unique=False)
    op.create_table('task_actions',
    sa.Column('id', sa.Integer(), nullable=False),
    sa.Column('task_id', sa.Integer(), nullable=False),
    sa.Column('social_account_id', sa.Integer(), nullable=False),
    sa.Column('liked', sa.Boolean(), nullable=False),
    sa.Column('shared', sa.Boolean(), nullable=False),
    sa.Column('commented', sa.Boolean(), nullable=False),
    sa.Column('updated_at', sa.DateTime(timezone=True), nullable=True),
    sa.ForeignKeyConstraint(['task_id'], ['tasks.id'], ondelete='CASCADE'),
    sa.ForeignKeyConstraint(['social_account_id'], ['social_accounts.id'], ondelete='CASCADE'),
    sa.PrimaryKeyConstraint('id'),
    sa.UniqueConstraint('task_id', 'social_account_id', name='uq_task_social_account')
    )
    op.create_index(op.f('ix_task_actions_id'), 'task_actions', ['id'], unique=False)


def downgrade():
    op.drop_index(op.f('ix_task_actions_id'), table_name='task_actions')
    op.drop_table('task_actions')
    op.drop_index(op.f('ix_tasks_id'), table_name='tasks')
    op.drop_table('tasks')
