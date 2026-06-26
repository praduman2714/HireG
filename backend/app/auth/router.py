from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.auth.dependencies import get_current_recruiter
from app.auth.models import Recruiter
from app.auth.schemas import RecruiterCreate, RecruiterLogin, RecruiterRead, Token
from app.auth.security import create_access_token, hash_password, verify_password
from app.db import models as db_models  # noqa: F401
from app.db.session import get_db


router = APIRouter(prefix="/auth", tags=["auth"])


@router.post("/register", response_model=Token, status_code=status.HTTP_201_CREATED)
def register_recruiter(
    payload: RecruiterCreate,
    db: Session = Depends(get_db),
) -> Token:
    email = payload.email.lower()
    existing_recruiter = db.scalar(select(Recruiter).where(Recruiter.email == email))
    if existing_recruiter is not None:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="A recruiter with this email already exists",
        )

    recruiter = Recruiter(
        name=payload.name.strip(),
        email=email,
        hashed_password=hash_password(payload.password),
    )
    db.add(recruiter)
    db.commit()
    db.refresh(recruiter)

    access_token = create_access_token(str(recruiter.id))
    return Token(access_token=access_token, recruiter=RecruiterRead.model_validate(recruiter))


@router.post("/login", response_model=Token)
def login_recruiter(
    payload: RecruiterLogin,
    db: Session = Depends(get_db),
) -> Token:
    email = payload.email.lower()
    recruiter = db.scalar(select(Recruiter).where(Recruiter.email == email))
    if recruiter is None or not verify_password(payload.password, recruiter.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )

    access_token = create_access_token(str(recruiter.id))
    return Token(access_token=access_token, recruiter=RecruiterRead.model_validate(recruiter))


@router.get("/me", response_model=RecruiterRead)
def read_current_recruiter(
    current_recruiter: Recruiter = Depends(get_current_recruiter),
) -> Recruiter:
    return current_recruiter
