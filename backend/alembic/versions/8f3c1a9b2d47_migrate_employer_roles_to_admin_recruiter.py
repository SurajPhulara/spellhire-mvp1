"""migrate employer roles to admin and recruiter

Revision ID: 8f3c1a9b2d47
Revises: d0c09863c9b4
Create Date: 2026-08-24 09:30:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = "8f3c1a9b2d47"
down_revision: Union[str, Sequence[str], None] = "d0c09863c9b4"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema: EmployerRole becomes ADMIN + RECRUITER; remap HR/EMPLOYER."""
    op.execute("ALTER TABLE employer_profiles ALTER COLUMN role DROP DEFAULT")
    op.execute("ALTER TABLE employer_profiles ALTER COLUMN role TYPE VARCHAR USING role::text")
    op.execute(
        """
        UPDATE employer_profiles
        SET role = 'RECRUITER'
        WHERE role IN ('HR', 'EMPLOYER')
        """
    )
    op.execute("DROP TYPE IF EXISTS employerrole")
    op.execute("CREATE TYPE employerrole AS ENUM ('ADMIN', 'RECRUITER')")
    op.execute(
        "ALTER TABLE employer_profiles ALTER COLUMN role TYPE employerrole USING role::employerrole"
    )
    op.execute("ALTER TABLE employer_profiles ALTER COLUMN role SET DEFAULT 'RECRUITER'")
    op.execute("ALTER TABLE employer_profiles ALTER COLUMN role SET NOT NULL")

    op.execute("ALTER TABLE employer_profiles DROP COLUMN IF EXISTS has_recruiter_permission")
    op.execute("ALTER TABLE employer_profiles DROP COLUMN IF EXISTS can_interview")
    op.execute("ALTER TABLE employer_profiles DROP COLUMN IF EXISTS has_recruiter_permission")
    op.execute("ALTER TABLE employer_profiles DROP COLUMN IF EXISTS can_interview")


def downgrade() -> None:
    """Downgrade schema: restore ADMIN/HR/EMPLOYER enum. RECRUITER maps back to EMPLOYER."""
    op.execute("ALTER TABLE employer_profiles ALTER COLUMN role DROP DEFAULT")
    op.execute("ALTER TABLE employer_profiles ALTER COLUMN role TYPE VARCHAR USING role::text")
    op.execute(
        """
        UPDATE employer_profiles
        SET role = 'EMPLOYER'
        WHERE role = 'RECRUITER'
        """
    )
    op.execute("DROP TYPE IF EXISTS employerrole")
    op.execute("CREATE TYPE employerrole AS ENUM ('ADMIN', 'HR', 'EMPLOYER')")
    op.execute(
        "ALTER TABLE employer_profiles ALTER COLUMN role TYPE employerrole USING role::employerrole"
    )
    op.execute("ALTER TABLE employer_profiles ALTER COLUMN role SET DEFAULT 'EMPLOYER'")
    op.execute("ALTER TABLE employer_profiles ALTER COLUMN role SET NOT NULL")

    op.add_column(
        "employer_profiles",
        sa.Column("has_recruiter_permission", sa.Boolean(), nullable=True, server_default=sa.true()),
    )
    op.add_column(
        "employer_profiles",
        sa.Column("can_interview", sa.Boolean(), nullable=True, server_default=sa.true()),
    )
