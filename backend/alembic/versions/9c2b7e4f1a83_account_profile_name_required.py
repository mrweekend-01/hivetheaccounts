"""profile_name required, corporate_email/corp_password optional, drop slot_number

Revision ID: 9c2b7e4f1a83
Revises: 4a8f2d6c9e17
Create Date: 2026-07-18 00:00:00.000000
"""
from alembic import op
import sqlalchemy as sa


revision = '9c2b7e4f1a83'
down_revision = '4a8f2d6c9e17'
branch_labels = None
depends_on = None


def upgrade():
    # respaldo antes de exigir NOT NULL: usa el correo (antes del @) si existe,
    # si no "Sin nombre" -- para no romper filas ya cargadas sin profile_name
    op.execute("""
        UPDATE accounts
        SET profile_name = COALESCE(
            NULLIF(split_part(corporate_email, '@', 1), ''),
            'Sin nombre'
        )
        WHERE profile_name IS NULL
    """)
    op.alter_column('accounts', 'profile_name', nullable=False)
    op.alter_column('accounts', 'corporate_email', nullable=True)
    op.alter_column('accounts', 'corp_password_encrypted', nullable=True)
    op.drop_column('social_accounts', 'slot_number')


def downgrade():
    op.add_column('social_accounts', sa.Column('slot_number', sa.Integer(), nullable=True))
    op.alter_column('accounts', 'corp_password_encrypted', nullable=False)
    op.alter_column('accounts', 'corporate_email', nullable=False)
    op.alter_column('accounts', 'profile_name', nullable=True)
