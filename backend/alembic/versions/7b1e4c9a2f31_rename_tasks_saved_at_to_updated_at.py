"""rename tasks.saved_at to updated_at

Revision ID: 7b1e4c9a2f31
Revises: c3f7a9e21b56
Create Date: 2026-07-17 00:00:00.000000
"""
from alembic import op
import sqlalchemy as sa


revision = '7b1e4c9a2f31'
down_revision = 'c3f7a9e21b56'
branch_labels = None
depends_on = None


def upgrade():
    op.alter_column('tasks', 'saved_at', new_column_name='updated_at')
    op.alter_column('tasks', 'updated_at', server_default=sa.text('now()'))
    # las tareas viejas "actuales" (saved_at NULL) quedan sin fecha de edición:
    # las respaldamos con created_at para que ordenen razonablemente
    op.execute('UPDATE tasks SET updated_at = created_at WHERE updated_at IS NULL')
    op.alter_column('tasks', 'link', server_default='')


def downgrade():
    op.alter_column('tasks', 'link', server_default=None)
    op.alter_column('tasks', 'updated_at', server_default=None)
    op.alter_column('tasks', 'updated_at', new_column_name='saved_at')
