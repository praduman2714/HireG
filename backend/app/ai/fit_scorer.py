import json
from typing import Any

from fastapi import HTTPException, status
from openai import OpenAI, OpenAIError
from pydantic import BaseModel, Field, ValidationError

from app.core.config import settings
from app.jobs.models import Job


class FitScoreResult(BaseModel):
    score: int = Field(ge=0, le=100)
    recommendation: str
    summary: str
    matched_skills: list[str] = Field(default_factory=list)
    missing_skills: list[str] = Field(default_factory=list)
    strengths: list[str] = Field(default_factory=list)
    concerns: list[str] = Field(default_factory=list)
    explanation: str
    raw_ai_response: dict[str, Any] | None = None


SYSTEM_PROMPT = """
You score candidate fit for recruiters. Return only valid JSON. Be fair,
specific, and evidence-based. Do not invent candidate experience.
""".strip()


def score_candidate_fit_with_ai(
    job: Job,
    parsed_resume: dict[str, Any] | None,
    resume_text: str | None,
) -> FitScoreResult:
    if not settings.openai_api_key:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="OPENAI_API_KEY is not configured",
        )

    if not parsed_resume and not resume_text:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Candidate needs parsed resume data or resume text before scoring",
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
                    "content": build_fit_scoring_prompt(job, parsed_resume, resume_text),
                },
            ],
        )
    except OpenAIError as exc:
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail=f"AI fit scoring failed: {exc.__class__.__name__}",
        ) from exc

    content = response.choices[0].message.content
    if not content:
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail="AI fit scoring returned an empty response",
        )

    try:
        parsed_json = json.loads(content)
        fit_score = FitScoreResult.model_validate(parsed_json)
    except (json.JSONDecodeError, ValidationError) as exc:
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail="AI fit scoring returned invalid JSON",
        ) from exc

    fit_score.raw_ai_response = parsed_json
    return fit_score


def build_fit_scoring_prompt(
    job: Job,
    parsed_resume: dict[str, Any] | None,
    resume_text: str | None,
) -> str:
    resume_context = (
        json.dumps(parsed_resume, indent=2)
        if parsed_resume
        else (resume_text or "")[:12000]
    )

    return f"""
Score this candidate against the job from 0 to 100.

Scoring guidance:
- 90-100: exceptional match, most requirements clearly satisfied.
- 75-89: strong match, minor gaps.
- 60-74: possible match, meaningful gaps or uncertainty.
- 40-59: weak match, several major gaps.
- 0-39: poor match.

Return this JSON shape exactly:
{{
  "score": integer from 0 to 100,
  "recommendation": "strong_match" | "possible_match" | "weak_match" | "not_recommended",
  "summary": string,
  "matched_skills": [string],
  "missing_skills": [string],
  "strengths": [string],
  "concerns": [string],
  "explanation": string
}}

Job:
Title: {job.title}
Department: {job.department or "Not specified"}
Location: {job.location or "Not specified"}
Employment type: {job.employment_type or "Not specified"}
Description:
{job.description}

Requirements:
{job.requirements}

Candidate resume data:
{resume_context}
""".strip()
