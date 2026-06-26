"""create initial recruiter job and candidate tables

Revision ID: 202606260001
Revises:
Create Date: 2026-06-26 00:01:00.000000
"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql


revision: str = "202606260001"
down_revision: Union[str, None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


job_status = postgresql.ENUM("open", "closed", name="job_status", create_type=False)
candidate_status = postgresql.ENUM(
    "new",
    "reviewing",
    "shortlisted",
    "rejected",
    "hired",
    name="candidate_status",
    create_type=False,
)


def upgrade() -> None:
    postgresql.ENUM("open", "closed", name="job_status").create(op.get_bind(), checkfirst=True)
    postgresql.ENUM(
        "new",
        "reviewing",
        "shortlisted",
        "rejected",
        "hired",
        name="candidate_status",
    ).create(op.get_bind(), checkfirst=True)

    op.create_table(
        "recruiters",
        sa.Column("id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("name", sa.String(length=120), nullable=False),
        sa.Column("email", sa.String(length=255), nullable=False),
        sa.Column("hashed_password", sa.String(length=255), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(op.f("ix_recruiters_email"), "recruiters", ["email"], unique=True)

    op.create_table(
        "jobs",
        sa.Column("id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("recruiter_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("title", sa.String(length=160), nullable=False),
        sa.Column("department", sa.String(length=120), nullable=True),
        sa.Column("location", sa.String(length=160), nullable=True),
        sa.Column("employment_type", sa.String(length=80), nullable=True),
        sa.Column("status", job_status, server_default="open", nullable=False),
        sa.Column("description", sa.Text(), nullable=False),
        sa.Column("requirements", sa.Text(), nullable=False),
        sa.Column("closed_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.ForeignKeyConstraint(["recruiter_id"], ["recruiters.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(op.f("ix_jobs_department"), "jobs", ["department"], unique=False)
    op.create_index(op.f("ix_jobs_location"), "jobs", ["location"], unique=False)
    op.create_index(op.f("ix_jobs_recruiter_id"), "jobs", ["recruiter_id"], unique=False)
    op.create_index(op.f("ix_jobs_status"), "jobs", ["status"], unique=False)
    op.create_index(op.f("ix_jobs_title"), "jobs", ["title"], unique=False)

    op.create_table(
        "candidates",
        sa.Column("id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("job_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("recruiter_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("name", sa.String(length=160), nullable=True),
        sa.Column("email", sa.String(length=255), nullable=True),
        sa.Column("phone", sa.String(length=40), nullable=True),
        sa.Column("status", candidate_status, server_default="new", nullable=False),
        sa.Column("resume_file_path", sa.String(length=500), nullable=True),
        sa.Column("resume_text", sa.Text(), nullable=True),
        sa.Column("parsed_resume", postgresql.JSONB(astext_type=sa.Text()), nullable=True),
        sa.Column("fit_score", sa.Integer(), nullable=True),
        sa.Column("fit_summary", sa.String(length=255), nullable=True),
        sa.Column("fit_explanation", sa.Text(), nullable=True),
        sa.Column("fit_result", postgresql.JSONB(astext_type=sa.Text()), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.CheckConstraint(
            "fit_score IS NULL OR (fit_score >= 0 AND fit_score <= 100)",
            name="ck_candidates_fit_score_range",
        ),
        sa.ForeignKeyConstraint(["job_id"], ["jobs.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["recruiter_id"], ["recruiters.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(op.f("ix_candidates_email"), "candidates", ["email"], unique=False)
    op.create_index(op.f("ix_candidates_fit_score"), "candidates", ["fit_score"], unique=False)
    op.create_index("ix_candidates_job_fit_score", "candidates", ["job_id", "fit_score"], unique=False)
    op.create_index(op.f("ix_candidates_job_id"), "candidates", ["job_id"], unique=False)
    op.create_index(op.f("ix_candidates_name"), "candidates", ["name"], unique=False)
    op.create_index(op.f("ix_candidates_recruiter_id"), "candidates", ["recruiter_id"], unique=False)
    op.create_index(op.f("ix_candidates_status"), "candidates", ["status"], unique=False)


def downgrade() -> None:
    op.drop_index(op.f("ix_candidates_status"), table_name="candidates")
    op.drop_index(op.f("ix_candidates_recruiter_id"), table_name="candidates")
    op.drop_index(op.f("ix_candidates_name"), table_name="candidates")
    op.drop_index(op.f("ix_candidates_job_id"), table_name="candidates")
    op.drop_index("ix_candidates_job_fit_score", table_name="candidates")
    op.drop_index(op.f("ix_candidates_fit_score"), table_name="candidates")
    op.drop_index(op.f("ix_candidates_email"), table_name="candidates")
    op.drop_table("candidates")

    op.drop_index(op.f("ix_jobs_title"), table_name="jobs")
    op.drop_index(op.f("ix_jobs_status"), table_name="jobs")
    op.drop_index(op.f("ix_jobs_recruiter_id"), table_name="jobs")
    op.drop_index(op.f("ix_jobs_location"), table_name="jobs")
    op.drop_index(op.f("ix_jobs_department"), table_name="jobs")
    op.drop_table("jobs")

    op.drop_index(op.f("ix_recruiters_email"), table_name="recruiters")
    op.drop_table("recruiters")

    candidate_status.drop(op.get_bind(), checkfirst=True)
    job_status.drop(op.get_bind(), checkfirst=True)
