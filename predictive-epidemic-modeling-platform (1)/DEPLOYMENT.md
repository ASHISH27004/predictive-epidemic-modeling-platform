Deployment and production checklist

This document explains how to make the project production-ready and deploy it (Docker + Docker Compose or cloud).

1) Quick local production (Docker Compose)
- From project root run:

  docker compose build
  docker compose up -d

- The `api` service is built from `backend/Dockerfile` and listens on port 8000.
- Persist the auth/history JSON data by mounting a volume for `backend/app/data`:

  In `docker-compose.yml` for the `api` service, add a volume mapping:

    volumes:
      - ./backend/app/data:/app/backend/app/data

2) Recommended production changes (security and reliability)
- Replace the JSON file storage with a proper database (Postgres or managed DB).
  - Add SQLAlchemy / SQLModel and Alembic migrations.
  - Migrate user storage, hash passwords (bcrypt), and use JWT for auth.
- Use environment variables for secrets and configuration. Do not store credentials in repo.
- Configure HTTPS via a reverse proxy (nginx, Traefik) or managed platform (Cloud Run, Render, ECS + ALB).
- Use managed Postgres for reliability and backups.
- Replace development token store with JWT tokens signed by a secret (rotate keys).

3) CI / CD
- Add a CI pipeline to build and run tests, build images, and push to registry.
- Use the existing `deploy.sh` as a starting point for ECR/ECS or modify for other targets.

4) Running migrations / initial admin user
- If you adopt Postgres + Alembic:
  - Create migration to add `users` and `history` tables.
  - Provide a small management script to create an initial admin user or use a one-off container run.

5) Monitoring and health
- Keep `/health` endpoint (already present) monitored by your load balancer or service.
- Add logging and error aggregation (Sentry or similar) for production visibility.

6) Notes on current quick setup
- The repository currently contains a minimal JSON-backed auth/history endpoint (development only).
- To test locally, run backend (see README). The UI in `smart grid Fullstack App.html` (in Downloads) has a simple JS shim that uses `http://localhost:8000/api` endpoints for testing.

If you'd like, I can:
- Port the auth UI into the React frontend (`src/...`) and remove the temporary HTML edits.
- Replace the JSON store with SQLite/Postgres and add migrations.
- Add Docker Compose volume mapping and a Compose override for local development.
- Create a CI workflow to build and push images.

Choose which next step you'd like me to implement automatically.
