"""add app_settings table

Revision ID: 4b196624f7c8
Revises: 7cd3375a711f
Create Date: 2026-07-15 16:40:58.009462
"""
from alembic import op
import sqlalchemy as sa


revision = '4b196624f7c8'
down_revision = '7cd3375a711f'
branch_labels = None
depends_on = None

app_settings = sa.table(
    'app_settings',
    sa.column('id', sa.Integer),
    sa.column('humanization_minutes', sa.Integer),
)


def upgrade():
    op.create_table('app_settings',
    sa.Column('id', sa.Integer(), nullable=False),
    sa.Column('humanization_minutes', sa.Integer(), nullable=False),
    sa.PrimaryKeyConstraint('id')
    )
    # siembra la fila única (id=1) con el valor por defecto actual
    op.bulk_insert(app_settings, [{'id': 1, 'humanization_minutes': 30}])


def downgrade():
    op.drop_table('app_settings')
