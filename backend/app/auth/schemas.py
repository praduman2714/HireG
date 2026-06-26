import uuid
from datetime import datetime
import re

from pydantic import BaseModel, ConfigDict, Field, field_validator


EMAIL_PATTERN = re.compile(r"^[^@\s]+@[^@\s]+\.[^@\s]+$")


class EmailModel(BaseModel):
    @field_validator("email", check_fields=False)
    @classmethod
    def validate_email(cls, value: str) -> str:
        email = value.strip().lower()
        if not EMAIL_PATTERN.fullmatch(email):
            raise ValueError("Enter a valid email address")
        return email


class RecruiterCreate(EmailModel):
    name: str = Field(min_length=2, max_length=120)
    email: str = Field(max_length=255)
    password: str = Field(min_length=8, max_length=128)


class RecruiterLogin(EmailModel):
    email: str = Field(max_length=255)
    password: str = Field(min_length=1, max_length=128)


class RecruiterRead(EmailModel):
    id: uuid.UUID
    name: str
    email: str
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"
    recruiter: RecruiterRead


class TokenPayload(BaseModel):
    sub: str
