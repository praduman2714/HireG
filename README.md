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
