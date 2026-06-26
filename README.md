# HireG

Recruiter workspace for managing job openings, candidates, AI resume parsing, and fit scoring.

## Tech Stack

- FastAPI
- PostgreSQL
- JWT authentication
- React
- TypeScript
- Docker Compose
- OpenAI API for resume parsing and fit scoring

## Local Setup

1. Copy the environment file:

   ```bash
   cp .env.example .env
   ```

2. Add required secrets to `.env`, especially `JWT_SECRET_KEY` and `OPENAI_API_KEY`.

3. Start the app:

   ```bash
   docker-compose up --build
   ```

4. Open:

   - Frontend: `http://localhost:5173`
   - Backend health check: `http://localhost:8000/health`

For local Uvicorn outside Docker, use `localhost` in `.env`:

```env
DATABASE_URL=postgresql+psycopg://hireg:hireg@localhost:5432/hireg
```

Docker Compose overrides this for the backend container and uses the internal `db` hostname.

## Database

The initial schema is managed with Alembic.

Run migrations inside the backend container:

```bash
docker-compose run --rm backend alembic upgrade head
```

Core tables:

- `recruiters`
- `jobs`
- `candidates`

Jobs and candidates are recruiter-scoped. Candidate records include resume text, parsed resume JSON, fit score, and AI scoring output.

## Architecture Notes

The backend owns authentication, recruiter-scoped data access, resume parsing, and fit scoring. The frontend provides the recruiter workflow for jobs and candidates.

## Auth API

Recruiter authentication uses JWT bearer tokens.

Endpoints:

- `POST /auth/register`
- `POST /auth/login`
- `POST /auth/login-json`
- `GET /auth/me`

Swagger's Authorize button uses `POST /auth/login`. Enter the recruiter email in the `username` field and the recruiter password in the `password` field. Leave `client_id` and `client_secret` blank.

Use returned access tokens as:

```txt
Authorization: Bearer <token>
```

## Jobs API

Job routes are protected and scoped to the authenticated recruiter.

Endpoints:

- `POST /jobs`
- `GET /jobs`
- `GET /jobs/{job_id}`
- `PATCH /jobs/{job_id}`
- `POST /jobs/{job_id}/close`
- `DELETE /jobs/{job_id}`

Supported list filters:

- `status`
- `search`
- `department`
- `location`
- `employment_type`

## Candidates API

Candidate routes are protected and scoped to the authenticated recruiter. Candidates are linked to jobs.

Endpoints:

- `POST /jobs/{job_id}/candidates`
- `POST /jobs/{job_id}/candidates/upload-resume`
- `GET /jobs/{job_id}/candidates`
- `GET /candidates/{candidate_id}`
- `PATCH /candidates/{candidate_id}`
- `POST /candidates/{candidate_id}/parse-resume`
- `DELETE /candidates/{candidate_id}`

Supported candidate list filters:

- `status`
- `search`

Resume upload supports PDF, DOCX, and TXT files. Uploaded files are stored in `backend/uploads/resumes` locally, and extracted text is saved on the candidate record as `resume_text`.

AI resume parsing uses `OPENAI_API_KEY` and `OPENAI_MODEL`. The parser reads a candidate's `resume_text`, extracts structured resume data, saves it as `parsed_resume`, and backfills missing candidate name, email, and phone fields when available.

Set these before testing AI parsing:

```env
OPENAI_API_KEY=your_api_key_here
OPENAI_MODEL=gpt-4o-mini
```

Then call:

```txt
POST /candidates/{candidate_id}/parse-resume
```

## Data Model

Core entities:

- Recruiters
- Jobs
- Candidates

Candidate records store structured resume data, AI fit scores, and the AI explanation for recruiter review.

## AI Strategy

Resume uploads will be converted to text, parsed into strict JSON, and then scored against the selected job description and requirements.

## What I Would Improve With More Time

- Background jobs for long resume parsing tasks
- Bulk resume upload and ranking
- More detailed audit logs for AI outputs
- Advanced candidate pipeline stages
