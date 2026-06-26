# Deployment Guide

HireG can be deployed as three services:

- PostgreSQL database
- FastAPI backend
- React frontend

## Backend Service

Use `backend/Dockerfile`.

Required environment variables:

```env
ENVIRONMENT=production
APP_NAME=HireG API
DATABASE_URL=postgresql+psycopg://USER:PASSWORD@HOST:PORT/DB_NAME
JWT_SECRET_KEY=replace-with-a-long-random-secret
JWT_ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=60
OPENAI_API_KEY=your_openai_api_key
OPENAI_MODEL=gpt-4o-mini
CORS_ORIGINS=["https://your-frontend-url.com"]
UPLOAD_DIR=uploads
```

Start command is already handled by the Dockerfile:

```bash
alembic upgrade head && uvicorn app.main:app --host 0.0.0.0 --port ${PORT:-8000}
```

Health check:

```txt
GET /health
```

## Frontend Service

Use `frontend/Dockerfile` with the `production` target.

Build argument:

```env
VITE_API_BASE_URL=https://your-backend-url.com
```

The production image builds the React app and serves it through Nginx with SPA fallback routing.

## Local Production Image Checks

Build backend:

```bash
docker build -t hireg-backend ./backend
```

Build frontend:

```bash
docker build \
  --target production \
  --build-arg VITE_API_BASE_URL=http://localhost:8000 \
  -t hireg-frontend ./frontend
```

## Deployment Checklist

1. Create a managed PostgreSQL database.
2. Deploy the backend Docker service.
3. Set all backend environment variables.
4. Confirm `GET /health` works.
5. Deploy the frontend Docker/static service.
6. Set `VITE_API_BASE_URL` to the deployed backend URL during frontend build.
7. Update backend `CORS_ORIGINS` with the deployed frontend URL.
8. Add deployed frontend and backend URLs to the README.
9. Mention if the chosen free tier sleeps after inactivity.

## Recommended Free-Tier Flow

Use:

- Database: Neon PostgreSQL
- Backend: Render Web Service
- Frontend: Vercel

Deploy in this order:

1. Neon PostgreSQL
2. Render backend
3. Vercel frontend
4. Update Render CORS with the Vercel URL

The backend needs `DATABASE_URL`, so PostgreSQL must be created before the backend.

## 1. Neon PostgreSQL

1. Open Neon and create a new project.
2. Create or use the default database.
3. Copy the pooled connection string from Neon.
4. Convert the URL scheme for SQLAlchemy/psycopg:

```txt
postgresql://USER:PASSWORD@HOST/DB?sslmode=require
```

to:

```txt
postgresql+psycopg://USER:PASSWORD@HOST/DB?sslmode=require
```

Use that value as `DATABASE_URL` in Render.

## 2. Render Backend

Create a new Render Web Service from the GitHub repo.

Suggested settings:

```txt
Root Directory: backend
Runtime: Docker
Dockerfile Path: ./Dockerfile
Health Check Path: /health
```

Set environment variables:

```env
ENVIRONMENT=production
APP_NAME=HireG API
DATABASE_URL=postgresql+psycopg://USER:PASSWORD@HOST/DB?sslmode=require
JWT_SECRET_KEY=replace-with-a-long-random-secret
JWT_ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=60
OPENAI_API_KEY=your_openai_api_key
OPENAI_MODEL=gpt-4o-mini
CORS_ORIGINS=["http://localhost:5173"]
UPLOAD_DIR=uploads
```

After Render deploys, open:

```txt
https://your-render-service.onrender.com/health
```

Expected response:

```json
{"status":"ok","service":"HireG API"}
```

Keep the backend URL. You will need it for Vercel.

## 3. Vercel Frontend

Create a new Vercel project from the same GitHub repo.

Suggested settings:

```txt
Root Directory: frontend
Framework Preset: Vite
Build Command: npm run build
Output Directory: dist
Install Command: npm ci
```

Set environment variable:

```env
VITE_API_BASE_URL=https://hireg-backend.onrender.com
```

Deploy the project and copy the Vercel frontend URL.

## 4. Final Render CORS Update

Go back to the Render backend environment variables and update:

```env
CORS_ORIGINS=["https://your-vercel-app.vercel.app"]
```

Redeploy the backend after changing CORS.

## 5. Final README Update

Update README live URLs:

```txt
Frontend: https://your-vercel-app.vercel.app
Backend: https://your-render-service.onrender.com
```

Also mention that Render free services may sleep after inactivity.
