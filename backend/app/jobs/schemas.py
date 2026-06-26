import uuid
from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field, field_validator

from app.jobs.models import JobStatus


class JobBase(BaseModel):
    title: str = Field(min_length=2, max_length=160)
    department: str | None = Field(default=None, max_length=120)
    location: str | None = Field(default=None, max_length=160)
    employment_type: str | None = Field(default=None, max_length=80)
    description: str = Field(min_length=10)
    requirements: str = Field(min_length=10)

    @field_validator("title", "department", "location", "employment_type", mode="before")
    @classmethod
    def strip_short_text(cls, value: str | None) -> str | None:
        if value is None:
            return value
        cleaned = value.strip()
        return cleaned or None

    @field_validator("description", "requirements", mode="before")
    @classmethod
    def strip_long_text(cls, value: str) -> str:
        return value.strip()


class JobCreate(JobBase):
    pass


class JobUpdate(BaseModel):
    title: str | None = Field(default=None, min_length=2, max_length=160)
    department: str | None = Field(default=None, max_length=120)
    location: str | None = Field(default=None, max_length=160)
    employment_type: str | None = Field(default=None, max_length=80)
    description: str | None = Field(default=None, min_length=10)
    requirements: str | None = Field(default=None, min_length=10)
    status: JobStatus | None = None

    @field_validator(
        "title",
        "department",
        "location",
        "employment_type",
        "description",
        "requirements",
        mode="before",
    )
    @classmethod
    def strip_text(cls, value: str | None) -> str | None:
        if value is None:
            return value
        cleaned = value.strip()
        return cleaned or None


class JobRead(BaseModel):
    id: uuid.UUID
    recruiter_id: uuid.UUID
    title: str
    department: str | None
    location: str | None
    employment_type: str | None
    status: JobStatus
    description: str
    requirements: str
    closed_at: datetime | None
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)
