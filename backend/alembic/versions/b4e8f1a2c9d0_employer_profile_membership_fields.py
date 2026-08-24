"""employer profile membership fields and interviewer role

Revision ID: b4e8f1a2c9d0
Revises: c30b3a851be8
Create Date: 2026-08-24 22:05:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql


revision: str = "b4e8f1a2c9d0"
down_revision: Union[str, Sequence[str], None] = "c30b3a851be8"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.execute("DROP TABLE IF EXISTS organization_members CASCADE")
    op.execute("DROP TYPE IF EXISTS teammemberrole")
    op.execute("DROP TYPE IF EXISTS teammemberstatus")

    op.execute("ALTER TYPE employerrole ADD VALUE IF NOT EXISTS 'INTERVIEWER'")

    employer_status = postgresql.ENUM(
        "INVITED",
        "ACTIVE",
        "REJECTED",
        "DISABLED",
        name="employerprofilestatus",
        create_type=False,
    )
    employer_status.create(op.get_bind(), checkfirst=True)

    op.alter_column(
        "employer_profiles",
        "user_id",
        existing_type=postgresql.UUID(as_uuid=True),
        nullable=True,
    )

    op.add_column("employer_profiles", sa.Column("invited_by_employer_id", postgresql.UUID(as_uuid=True), nullable=True))
    op.add_column("employer_profiles", sa.Column("email", sa.String(length=255), nullable=True))
    op.add_column(
        "employer_profiles",
        sa.Column("status", sa.Enum("INVITED", "ACTIVE", "REJECTED", "DISABLED", name="employerprofilestatus"), nullable=True),
    )
    op.add_column("employer_profiles", sa.Column("experience_years", sa.Float(), nullable=True))
    op.add_column("employer_profiles", sa.Column("invitation_token", sa.String(length=255), nullable=True))
    op.add_column("employer_profiles", sa.Column("invitation_expires_at", sa.DateTime(timezone=True), nullable=True))
    op.add_column("employer_profiles", sa.Column("invited_at", sa.DateTime(timezone=True), nullable=True))
    op.add_column("employer_profiles", sa.Column("accepted_at", sa.DateTime(timezone=True), nullable=True))
    op.add_column("employer_profiles", sa.Column("rejected_at", sa.DateTime(timezone=True), nullable=True))

    op.execute(
        """
        UPDATE employer_profiles ep
        SET email = u.email
        FROM users u
        WHERE ep.user_id = u.id
          AND (ep.email IS NULL OR ep.email = '')
        """
    )
    op.execute(
        """
        UPDATE employer_profiles
        SET status = 'ACTIVE'
        WHERE status IS NULL
        """
    )
    op.execute(
        """
        UPDATE employer_profiles
        SET accepted_at = created_at
        WHERE accepted_at IS NULL AND user_id IS NOT NULL
        """
    )
    # Oldest member in each org (typically the creator) becomes ADMIN.
    op.execute(
        """
        UPDATE employer_profiles ep
        SET role = 'ADMIN'
        WHERE ep.id IN (
            SELECT DISTINCT ON (organization_id) id
            FROM employer_profiles
            WHERE organization_id IS NOT NULL
            ORDER BY organization_id, created_at ASC
        )
        """
    )
    op.execute(
        """
        UPDATE employer_profiles
        SET role = 'RECRUITER'
        WHERE role::text NOT IN ('ADMIN', 'RECRUITER', 'INTERVIEWER')
        """
    )

    op.alter_column(
        "employer_profiles",
        "status",
        existing_type=postgresql.ENUM("INVITED", "ACTIVE", "REJECTED", "DISABLED", name="employerprofilestatus"),
        nullable=False,
        server_default="ACTIVE",
    )

    op.create_foreign_key(
        "fk_employer_profiles_invited_by",
        "employer_profiles",
        "employer_profiles",
        ["invited_by_employer_id"],
        ["id"],
        ondelete="SET NULL",
    )
    op.create_index("ix_employer_profiles_email", "employer_profiles", ["email"])
    op.create_index("ix_employer_profiles_status", "employer_profiles", ["status"])
    op.create_index(
        "uq_employer_profiles_org_email",
        "employer_profiles",
        ["organization_id", "email"],
        unique=True,
        postgresql_where=sa.text("email IS NOT NULL"),
    )
    op.create_index(
        "uq_employer_profiles_invitation_token",
        "employer_profiles",
        ["invitation_token"],
        unique=True,
        postgresql_where=sa.text("invitation_token IS NOT NULL"),
    )

    op.execute("ALTER TABLE employer_profiles DROP COLUMN IF EXISTS has_recruiter_permission")
    op.execute("ALTER TABLE employer_profiles DROP COLUMN IF EXISTS can_interview")


def downgrade() -> None:
    op.execute("ALTER TABLE employer_profiles DROP COLUMN IF EXISTS has_recruiter_permission")
    op.drop_index("uq_employer_profiles_invitation_token", table_name="employer_profiles")
    op.drop_index("uq_employer_profiles_org_email", table_name="employer_profiles")
    op.drop_index("ix_employer_profiles_status", table_name="employer_profiles")
    op.drop_index("ix_employer_profiles_email", table_name="employer_profiles")
    op.drop_constraint("fk_employer_profiles_invited_by", "employer_profiles", type_="foreignkey")

    op.drop_column("employer_profiles", "rejected_at")
    op.drop_column("employer_profiles", "accepted_at")
    op.drop_column("employer_profiles", "invited_at")
    op.drop_column("employer_profiles", "invitation_expires_at")
    op.drop_column("employer_profiles", "invitation_token")
    op.drop_column("employer_profiles", "experience_years")
    op.drop_column("employer_profiles", "status")
    op.drop_column("employer_profiles", "email")
    op.drop_column("employer_profiles", "invited_by_employer_id")

    op.alter_column(
        "employer_profiles",
        "user_id",
        existing_type=postgresql.UUID(as_uuid=True),
        nullable=False,
    )

    op.execute("DROP TYPE IF EXISTS employerprofilestatus")
