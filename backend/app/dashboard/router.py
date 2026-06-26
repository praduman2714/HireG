from fastapi import APIRouter, Depends
from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.auth.dependencies import get_current_recruiter
from app.auth.models import Recruiter
from app.candidates.models import Candidate, CandidateStatus
from app.db.session import get_db
from app.jobs.models import Job, JobStatus


router = APIRouter(prefix="/dashboard", tags=["dashboard"])


@router.get("/stats")
def read_dashboard_stats(
    db: Session = Depends(get_db),
    current_recruiter: Recruiter = Depends(get_current_recruiter),
) -> dict[str, object]:
    total_jobs = count_rows(db, select(func.count()).select_from(Job).where(Job.recruiter_id == current_recruiter.id))
    active_jobs = count_rows(
        db,
        select(func.count()).select_from(Job).where(
            Job.recruiter_id == current_recruiter.id,
            Job.status == JobStatus.OPEN,
        ),
    )
    closed_jobs = count_rows(
        db,
        select(func.count()).select_from(Job).where(
            Job.recruiter_id == current_recruiter.id,
            Job.status == JobStatus.CLOSED,
        ),
    )
    total_candidates = count_rows(
        db,
        select(func.count()).select_from(Candidate).where(Candidate.recruiter_id == current_recruiter.id),
    )
    shortlisted = count_rows(
        db,
        select(func.count()).select_from(Candidate).where(
            Candidate.recruiter_id == current_recruiter.id,
            Candidate.status == CandidateStatus.SHORTLISTED,
        ),
    )
    scored_candidates = count_rows(
        db,
        select(func.count()).select_from(Candidate).where(
            Candidate.recruiter_id == current_recruiter.id,
            Candidate.fit_score.is_not(None),
        ),
    )
    average_fit_score = db.scalar(
        select(func.avg(Candidate.fit_score)).where(
            Candidate.recruiter_id == current_recruiter.id,
            Candidate.fit_score.is_not(None),
        ),
    )

    return {
        "active_jobs": active_jobs,
        "total_jobs": total_jobs,
        "closed_jobs": closed_jobs,
        "total_candidates": total_candidates,
        "applications_received": total_candidates,
        "shortlisted_candidates": shortlisted,
        "scored_candidates": scored_candidates,
        "average_fit_score": round(float(average_fit_score or 0), 1),
        "pipeline": [
            {"name": "Jobs", "value": total_jobs},
            {"name": "Active", "value": active_jobs},
            {"name": "Candidates", "value": total_candidates},
            {"name": "Shortlisted", "value": shortlisted},
            {"name": "Scored", "value": scored_candidates},
        ],
    }


def count_rows(db: Session, statement) -> int:
    return int(db.scalar(statement) or 0)
