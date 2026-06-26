import uuid
from datetime import datetime
from typing import Any

from pydantic import BaseModel, ConfigDict, Field, field_validator

from app.candidates.models import CandidateStatus


class CandidateBase(BaseModel):
    name: str | None = Field(default=None, max_length=160)
    email: str | None = Field(default=None, max_length=255)
    phone: str | None = Field(default=None, max_length=40)
    status: CandidateStatus = CandidateStatus.NEW
    resume_text: str | None = None
    parsed_resume: dict[str, Any] | None = None

    @field_validator("name", "email", "phone", "resume_text", mode="before")
    @classmethod
    def strip_text(cls, value: str | None) -> str | None:
        if value is None:
            return value
        cleaned = value.strip()
        return cleaned or None

    @field_validator("email")
    @classmethod
    def lowercase_email(cls, value: str | None) -> str | None:
        return value.lower() if value else value


class CandidateCreate(CandidateBase):
    pass


class CandidateUpdate(BaseModel):
    name: str | None = Field(default=None, max_length=160)
    email: str | None = Field(default=None, max_length=255)
    phone: str | None = Field(default=None, max_length=40)
    status: CandidateStatus | None = None
    resume_text: str | None = None
    parsed_resume: dict[str, Any] | None = None
    fit_score: int | None = Field(default=None, ge=0, le=100)
    fit_summary: str | None = Field(default=None, max_length=255)
    fit_explanation: str | None = None
    fit_result: dict[str, Any] | None = None

    @field_validator(
        "name",
        "email",
        "phone",
        "resume_text",
        "fit_summary",
        "fit_explanation",
        mode="before",
    )
    @classmethod
    def strip_text(cls, value: str | None) -> str | None:
        if value is None:
            return value
        cleaned = value.strip()
        return cleaned or None

    @field_validator("email")
    @classmethod
    def lowercase_email(cls, value: str | None) -> str | None:
        return value.lower() if value else value


class CandidateRead(BaseModel):
    id: uuid.UUID
    job_id: uuid.UUID
    recruiter_id: uuid.UUID
    name: str | None
    email: str | None
    phone: str | None
    status: CandidateStatus
    resume_file_path: str | None
    resume_text: str | None
    parsed_resume: dict[str, Any] | None
    fit_score: int | None
    fit_summary: str | None
    fit_explanation: str | None
    fit_result: dict[str, Any] | None
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)
