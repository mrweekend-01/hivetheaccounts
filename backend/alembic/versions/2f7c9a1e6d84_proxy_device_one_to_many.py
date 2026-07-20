"""proxy<->device becomes 1:N (device_id moves from devices.proxy_id to proxies.device_id)

Revision ID: 2f7c9a1e6d84
Revises: 8d4f1c6a3b92
Create Date: 2026-07-20 00:00:00.000000
"""
from alembic import op
import sqlalchemy as sa


revision = '2f7c9a1e6d84'
down_revision = '8d4f1c6a3b92'
branch_labels = None
depends_on = None


def upgrade():
    op.add_column('proxies', sa.Column('device_id', sa.Integer(), nullable=True))
    op.create_foreign_key('proxies_device_id_fkey', 'proxies', 'devices',
                          ['device_id'], ['id'], ondelete='SET NULL')

    # preserva las asignaciones existentes antes de tirar devices.proxy_id
    op.execute("""
        UPDATE proxies SET device_id = devices.id
        FROM devices
        WHERE devices.proxy_id = proxies.id
    """)

    # drop_column tira en cascada el FK y el UNIQUE que dependían de esta columna
    op.drop_column('devices', 'proxy_id')


def downgrade():
    op.add_column('devices', sa.Column('proxy_id', sa.Integer(), nullable=True))
    op.create_foreign_key('devices_proxy_id_fkey', 'devices', 'proxies',
                          ['proxy_id'], ['id'], ondelete='SET NULL')
    op.create_unique_constraint('devices_proxy_id_key', 'devices', ['proxy_id'])

    # solo puede volver 1:1 -> si un device terminó con >1 proxy tras el
    # upgrade, downgrade se queda con uno cualquiera (el de menor id)
    op.execute("""
        UPDATE devices SET proxy_id = sub.proxy_id
        FROM (
            SELECT DISTINCT ON (device_id) device_id, id AS proxy_id
            FROM proxies
            WHERE device_id IS NOT NULL
            ORDER BY device_id, id
        ) sub
        WHERE devices.id = sub.device_id
    """)

    op.drop_constraint('proxies_device_id_fkey', 'proxies', type_='foreignkey')
    op.drop_column('proxies', 'device_id')
