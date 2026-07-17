"""add pausado humanization state + paused_remaining_seconds column

Revision ID: 5e8a1d3f9c62
Revises: 9c2b7e4f1a83
Create Date: 2026-07-18 00:00:00.000000
"""
from alembic import op
import sqlalchemy as sa


revision = '5e8a1d3f9c62'
down_revision = '9c2b7e4f1a83'
branch_labels = None
depends_on = None


def upgrade():
    # ALTER TYPE ... ADD VALUE no puede correr dentro de la transacción normal
    # de Alembic (Postgres lo exige fuera de un bloque transaccional) -> se
    # usa autocommit_block(), el patrón oficial de Alembic para este caso.
    with op.get_context().autocommit_block():
        op.execute("ALTER TYPE social_humanization_status ADD VALUE IF NOT EXISTS 'pausado'")

    op.add_column('social_accounts',
                  sa.Column('paused_remaining_seconds', sa.Integer(), nullable=True))


def downgrade():
    op.drop_column('social_accounts', 'paused_remaining_seconds')
    # Postgres no soporta quitar un valor de un ENUM directamente; no se
    # revierte el ALTER TYPE (dejarlo no rompe nada si no se usa el valor).
