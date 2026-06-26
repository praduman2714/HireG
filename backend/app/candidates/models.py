import enum
import uuid

from sqlalchemy import CheckConstraint, Enum, ForeignKey, Index, Integer, String, Text
from sqlalchemy.dialects.postgresql import JSONB, UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base
from app.db.mixins import TimestampMixin


class CandidateStatus(str, enum.Enum):
    NEW = "new"
    REVIEWING = "reviewing"
    SHORTLISTED = "shortlisted"
    REJECTED = "rejected"
    HIRED = "hired"


class Candidate(TimestampMixin, Base):
    __tablename__ = "candidates"
    __table_args__ = (
        CheckConstraint(
            "fit_score IS NULL OR (fit_score >= 0 AND fit_score <= 100)",
            name="ck_candidates_fit_score_range",
        ),
        Index("ix_candidates_job_fit_score", "job_id", "fit_score"),
    )

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        primary_key=True,
        default=uuid.uuid4,
    )
    job_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("jobs.id", ondelete="CASCADE"),
        index=True,
        nullable=False,
    )
    recruiter_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("recruiters.id", ondelete="CASCADE"),
        index=True,
        nullable=False,
    )
    name: Mapped[str | None] = mapped_column(String(160), index=True)
    email: Mapped[str | None] = mapped_column(String(255), index=True)
    phone: Mapped[str | None] = mapped_column(String(40))
    status: Mapped[CandidateStatus] = mapped_column(
        Enum(
            CandidateStatus,
            name="candidate_status",
            values_callable=lambda statuses: [status.value for status in statuses],
        ),
        default=CandidateStatus.NEW,
        nullable=False,
        index=True,
    )
    resume_file_path: Mapped[str | None] = mapped_column(String(500))
    resume_text: Mapped[str | None] = mapped_column(Text)
    parsed_resume: Mapped[dict | None] = mapped_column(JSONB)
    fit_score: Mapped[int | None] = mapped_column(Integer, index=True)
    fit_summary: Mapped[str | None] = mapped_column(String(255))
    fit_explanation: Mapped[str | None] = mapped_column(Text)
    fit_result: Mapped[dict | None] = mapped_column(JSONB)

    job = relationship("Job", back_populates="candidates")
    recruiter = relationship("Recruiter", back_populates="candidates")
