import uuid
from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.auth.dependencies import get_current_recruiter
from app.auth.models import Recruiter
from app.db.session import get_db
from app.jobs.models import Job, JobStatus
from app.jobs.schemas import JobCreate, JobRead, JobUpdate


router = APIRouter(prefix="/jobs", tags=["jobs"])


def get_recruiter_job(
    job_id: uuid.UUID,
    recruiter_id: uuid.UUID,
    db: Session,
) -> Job:
    job = db.scalar(
        select(Job).where(
            Job.id == job_id,
            Job.recruiter_id == recruiter_id,
        ),
    )
    if job is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Job not found",
        )
    return job


@router.post("", response_model=JobRead, status_code=status.HTTP_201_CREATED)
def create_job(
    payload: JobCreate,
    db: Session = Depends(get_db),
    current_recruiter: Recruiter = Depends(get_current_recruiter),
) -> Job:
    job = Job(
        recruiter_id=current_recruiter.id,
        title=payload.title,
        department=payload.department,
        location=payload.location,
        employment_type=payload.employment_type,
        description=payload.description,
        requirements=payload.requirements,
    )
    db.add(job)
    db.commit()
    db.refresh(job)
    return job


@router.get("", response_model=list[JobRead])
def list_jobs(
    status_filter: JobStatus | None = Query(default=None, alias="status"),
    search: str | None = Query(default=None, min_length=1),
    department: str | None = Query(default=None, min_length=1),
    location: str | None = Query(default=None, min_length=1),
    employment_type: str | None = Query(default=None, min_length=1),
    db: Session = Depends(get_db),
    current_recruiter: Recruiter = Depends(get_current_recruiter),
) -> list[Job]:
    statement = select(Job).where(Job.recruiter_id == current_recruiter.id)

    if status_filter is not None:
        statement = statement.where(Job.status == status_filter)
    if search:
        statement = statement.where(Job.title.ilike(f"%{search.strip()}%"))
    if department:
        statement = statement.where(Job.department.ilike(f"%{department.strip()}%"))
    if location:
        statement = statement.where(Job.location.ilike(f"%{location.strip()}%"))
    if employment_type:
        statement = statement.where(Job.employment_type.ilike(f"%{employment_type.strip()}%"))

    statement = statement.order_by(Job.created_at.desc())
    return list(db.scalars(statement).all())


@router.get("/{job_id}", response_model=JobRead)
def read_job(
    job_id: uuid.UUID,
    db: Session = Depends(get_db),
    current_recruiter: Recruiter = Depends(get_current_recruiter),
) -> Job:
    return get_recruiter_job(job_id, current_recruiter.id, db)


@router.patch("/{job_id}", response_model=JobRead)
def update_job(
    job_id: uuid.UUID,
    payload: JobUpdate,
    db: Session = Depends(get_db),
    current_recruiter: Recruiter = Depends(get_current_recruiter),
) -> Job:
    job = get_recruiter_job(job_id, current_recruiter.id, db)
    updates = payload.model_dump(exclude_unset=True)

    for field, value in updates.items():
        setattr(job, field, value)

    if "status" in updates:
        job.closed_at = datetime.now(timezone.utc) if job.status == JobStatus.CLOSED else None

    db.add(job)
    db.commit()
    db.refresh(job)
    return job


@router.post("/{job_id}/close", response_model=JobRead)
def close_job(
    job_id: uuid.UUID,
    db: Session = Depends(get_db),
    current_recruiter: Recruiter = Depends(get_current_recruiter),
) -> Job:
    job = get_recruiter_job(job_id, current_recruiter.id, db)
    job.status = JobStatus.CLOSED
    job.closed_at = datetime.now(timezone.utc)
    db.add(job)
    db.commit()
    db.refresh(job)
    return job


@router.delete("/{job_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_job(
    job_id: uuid.UUID,
    db: Session = Depends(get_db),
    current_recruiter: Recruiter = Depends(get_current_recruiter),
) -> None:
    job = get_recruiter_job(job_id, current_recruiter.id, db)
    db.delete(job)
    db.commit()
