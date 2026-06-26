import uuid

from fastapi import APIRouter, Depends, File, Form, HTTPException, Query, UploadFile, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.auth.dependencies import get_current_recruiter
from app.auth.models import Recruiter
from app.candidates.models import Candidate, CandidateStatus
from app.candidates.resume_service import extract_resume_text, save_resume_file, validate_resume_file
from app.candidates.schemas import CandidateCreate, CandidateRead, CandidateUpdate
from app.db.session import get_db
from app.jobs.router import get_recruiter_job


router = APIRouter(tags=["candidates"])


def get_recruiter_candidate(
    candidate_id: uuid.UUID,
    recruiter_id: uuid.UUID,
    db: Session,
) -> Candidate:
    candidate = db.scalar(
        select(Candidate).where(
            Candidate.id == candidate_id,
            Candidate.recruiter_id == recruiter_id,
        ),
    )
    if candidate is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Candidate not found",
        )
    return candidate


@router.post(
    "/jobs/{job_id}/candidates",
    response_model=CandidateRead,
    status_code=status.HTTP_201_CREATED,
)
def create_candidate(
    job_id: uuid.UUID,
    payload: CandidateCreate,
    db: Session = Depends(get_db),
    current_recruiter: Recruiter = Depends(get_current_recruiter),
) -> Candidate:
    get_recruiter_job(job_id, current_recruiter.id, db)

    candidate = Candidate(
        job_id=job_id,
        recruiter_id=current_recruiter.id,
        name=payload.name,
        email=payload.email,
        phone=payload.phone,
        status=payload.status,
        resume_text=payload.resume_text,
        parsed_resume=payload.parsed_resume,
    )
    db.add(candidate)
    db.commit()
    db.refresh(candidate)
    return candidate


@router.post(
    "/jobs/{job_id}/candidates/upload-resume",
    response_model=CandidateRead,
    status_code=status.HTTP_201_CREATED,
)
def upload_candidate_resume(
    job_id: uuid.UUID,
    file: UploadFile = File(...),
    name: str | None = Form(default=None),
    email: str | None = Form(default=None),
    phone: str | None = Form(default=None),
    db: Session = Depends(get_db),
    current_recruiter: Recruiter = Depends(get_current_recruiter),
) -> Candidate:
    get_recruiter_job(job_id, current_recruiter.id, db)

    suffix = validate_resume_file(file)
    file_path = save_resume_file(file, suffix)
    resume_text = extract_resume_text(file_path)

    candidate = Candidate(
        job_id=job_id,
        recruiter_id=current_recruiter.id,
        name=name.strip() if name else None,
        email=email.strip().lower() if email else None,
        phone=phone.strip() if phone else None,
        resume_file_path=str(file_path),
        resume_text=resume_text,
    )
    db.add(candidate)
    db.commit()
    db.refresh(candidate)
    return candidate


@router.get("/jobs/{job_id}/candidates", response_model=list[CandidateRead])
def list_candidates_for_job(
    job_id: uuid.UUID,
    status_filter: CandidateStatus | None = Query(default=None, alias="status"),
    search: str | None = Query(default=None, min_length=1),
    db: Session = Depends(get_db),
    current_recruiter: Recruiter = Depends(get_current_recruiter),
) -> list[Candidate]:
    get_recruiter_job(job_id, current_recruiter.id, db)

    statement = select(Candidate).where(
        Candidate.job_id == job_id,
        Candidate.recruiter_id == current_recruiter.id,
    )

    if status_filter is not None:
        statement = statement.where(Candidate.status == status_filter)
    if search:
        term = f"%{search.strip()}%"
        statement = statement.where(
            Candidate.name.ilike(term) | Candidate.email.ilike(term),
        )

    statement = statement.order_by(Candidate.fit_score.desc().nullslast(), Candidate.created_at.desc())
    return list(db.scalars(statement).all())


@router.get("/candidates/{candidate_id}", response_model=CandidateRead)
def read_candidate(
    candidate_id: uuid.UUID,
    db: Session = Depends(get_db),
    current_recruiter: Recruiter = Depends(get_current_recruiter),
) -> Candidate:
    return get_recruiter_candidate(candidate_id, current_recruiter.id, db)


@router.patch("/candidates/{candidate_id}", response_model=CandidateRead)
def update_candidate(
    candidate_id: uuid.UUID,
    payload: CandidateUpdate,
    db: Session = Depends(get_db),
    current_recruiter: Recruiter = Depends(get_current_recruiter),
) -> Candidate:
    candidate = get_recruiter_candidate(candidate_id, current_recruiter.id, db)
    updates = payload.model_dump(exclude_unset=True)

    for field, value in updates.items():
        setattr(candidate, field, value)

    db.add(candidate)
    db.commit()
    db.refresh(candidate)
    return candidate


@router.delete("/candidates/{candidate_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_candidate(
    candidate_id: uuid.UUID,
    db: Session = Depends(get_db),
    current_recruiter: Recruiter = Depends(get_current_recruiter),
) -> None:
    candidate = get_recruiter_candidate(candidate_id, current_recruiter.id, db)
    db.delete(candidate)
    db.commit()
