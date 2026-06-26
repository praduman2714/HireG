import json
from typing import Any

from fastapi import HTTPException, status
from openai import OpenAI, OpenAIError
from pydantic import BaseModel, Field, ValidationError

from app.core.config import settings


class ParsedExperience(BaseModel):
    company: str | None = None
    title: str | None = None
    duration: str | None = None
    summary: str | None = None


class ParsedEducation(BaseModel):
    institution: str | None = None
    degree: str | None = None
    year: str | None = None


class ParsedResume(BaseModel):
    name: str | None = None
    email: str | None = None
    phone: str | None = None
    location: str | None = None
    summary: str | None = None
    skills: list[str] = Field(default_factory=list)
    years_of_experience: float | None = None
    work_experience: list[ParsedExperience] = Field(default_factory=list)
    education: list[ParsedEducation] = Field(default_factory=list)
    projects: list[str] = Field(default_factory=list)
    certifications: list[str] = Field(default_factory=list)
    raw_ai_response: dict[str, Any] | None = None


SYSTEM_PROMPT = """
You parse resumes for recruiters. Return only valid JSON. Do not invent facts.
If a field is missing, return null for scalar fields or [] for lists.
""".strip()


def parse_resume_with_ai(resume_text: str) -> ParsedResume:
    if not settings.openai_api_key:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="OPENAI_API_KEY is not configured",
        )

    try:
        client = OpenAI(api_key=settings.openai_api_key)
        response = client.chat.completions.create(
            model=settings.openai_model,
            temperature=0,
            response_format={"type": "json_object"},
            messages=[
                {"role": "system", "content": SYSTEM_PROMPT},
                {
                    "role": "user",
                    "content": build_resume_parser_prompt(resume_text),
                },
            ],
        )
    except OpenAIError as exc:
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail=f"AI resume parsing failed: {exc.__class__.__name__}",
        ) from exc

    content = response.choices[0].message.content
    if not content:
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail="AI resume parsing returned an empty response",
        )

    try:
        parsed_json = json.loads(content)
        parsed_resume = ParsedResume.model_validate(parsed_json)
    except (json.JSONDecodeError, ValidationError) as exc:
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail="AI resume parsing returned invalid JSON",
        ) from exc

    parsed_resume.raw_ai_response = parsed_json
    return parsed_resume


def build_resume_parser_prompt(resume_text: str) -> str:
    return f"""
Extract structured candidate information from this resume.

Return this JSON shape exactly:
{{
  "name": string or null,
  "email": string or null,
  "phone": string or null,
  "location": string or null,
  "summary": string or null,
  "skills": [string],
  "years_of_experience": number or null,
  "work_experience": [
    {{
      "company": string or null,
      "title": string or null,
      "duration": string or null,
      "summary": string or null
    }}
  ],
  "education": [
    {{
      "institution": string or null,
      "degree": string or null,
      "year": string or null
    }}
  ],
  "projects": [string],
  "certifications": [string]
}}

Resume text:
\"\"\"
{resume_text[:12000]}
\"\"\"
""".strip()
