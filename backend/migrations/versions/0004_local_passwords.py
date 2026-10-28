"""Add local password hashes, first-login change flag and session revision.

No existing password, role or application record is overwritten. Legacy local
users without configured passwords are provisioned at their first verified login.
"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import mssql

revision = '0004'
down_revision = '0003'
branch_labels = None
depends_on = None


def upgrade():
    op.add_column('Users', sa.Column('passwordHash', mssql.NVARCHAR(256, collation='Latin1_General_100_BIN2'), nullable=True), schema='dbo')
    op.add_column('Users', sa.Column('passwordMustChange', mssql.BIT(), nullable=False, server_default=sa.text('0')), schema='dbo')
    op.add_column('Users', sa.Column('passwordVersion', sa.BigInteger(), nullable=False, server_default=sa.text('0')), schema='dbo')


def downgrade():
    # A downgrade would reactivate obsolete adapter passwords. Require release
    # restore instead of silently discarding credentials that people changed.
    if op.get_bind().scalar(sa.text('SELECT COUNT(*) FROM dbo.[Users] WHERE passwordHash IS NOT NULL')):
        raise RuntimeError('Local passwords exist; restore the matching release backup instead')
    for name in ('passwordVersion', 'passwordMustChange', 'passwordHash'):
        op.drop_column('Users', name, schema='dbo', mssql_drop_default=name != 'passwordHash')
