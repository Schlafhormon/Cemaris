"""Remove credentials and transient errors from retired Sunrise integrations.

Revision ID: 0002
Revises: 0001

Application tables and historical contract metadata are deliberately retained.
Passwords, including previous values, are removed with their entire settings
row. Downgrading does not restore deleted credentials.
"""

from alembic import op
import sqlalchemy as sa

revision = "0002"
down_revision = "0001"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.execute(sa.text("DELETE FROM dbo.UserSettings WHERE LOWER(settingKey) LIKE N'consignocloud.%'"))
    op.execute(sa.text("DELETE FROM dbo.CemarisSettings WHERE LOWER(settingKey) = N'integrations.portal.syncerror'"))


def downgrade() -> None:
    # Retired integration credentials must never be reconstructed or restored.
    pass
