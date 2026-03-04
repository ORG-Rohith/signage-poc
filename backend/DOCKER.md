# Docker / Production Setup

This guide covers building, running, and deploying the NestJS backend in Docker.

## Quick Start: Build & Run

Build the production image (multi-stage Dockerfile is included):

```bash
docker build -t signage-backend:latest .
```

Run the container locally (exposes port 3001):

```bash
docker run --rm -p 3001:3001 --name signage-backend \
  -e NODE_ENV=production \
  -e DATABASE_URL=postgresql://user:password@host:5432/signage \
  signage-backend:latest
```

## Docker Compose (with PostgreSQL)

A `docker-compose.yml` is included. To start both backend and database:

```bash
docker-compose up -d
```

Check logs:

```bash
docker-compose logs -f signage-backend
```

Stop services:

```bash
docker-compose down
```

## Environment Variables

Required environment variables for production:

- `NODE_ENV=production` — enables optimizations
- `DATABASE_URL` — PostgreSQL connection string
- `PORT` — server port (default: 3001)

Example `.env.prod`:

```
NODE_ENV=production
DATABASE_URL=postgresql://user:password@postgres.example.com:5432/signage
PORT=3001
```

Run with env file:

```bash
docker run --rm --env-file .env.prod -p 3001:3001 signage-backend:latest
```

## Database Migrations

Prisma migrations are included in the image (`prisma/`). To run migrations in the container:

```bash
docker exec signage-backend npx prisma migrate deploy
```

Or add to your orchestrator startup hooks (e.g., Kubernetes init containers).

## File Uploads

The container creates an `uploads/` directory for file uploads. To persist uploads across container restarts, mount a volume:

```bash
docker run --rm -p 3001:3001 \
  -v uploads_volume:/app/uploads \
  -e DATABASE_URL=postgresql://... \
  signage-backend:latest
```

## Local Build (without Docker)

```bash
npm ci
npm run build
npm run start:prod
```

## Security & Production Notes

- **Non-root:** container runs as unprivileged `app` user.
- **Reproducible installs:** builds use `package-lock.json` and `npm ci`.
- **Minimal runtime:** multi-stage build keeps dev tooling out of final image.
- **Healthcheck:** container exposes a healthcheck for orchestrators (probes `GET /`).
- **Signal handling:** `tini` is included for proper signal handling and child reaping.

## Recommended Next Steps for Hardening

- **Pin base images** to immutable digests (e.g., `node:20-alpine@sha256:...`).
- **Scan images in CI** with `trivy` or `docker scan`; fail on high severity findings.
- **Secrets management:** avoid embedding secrets; use a secret manager or orchestrator facility.
- **Private registry:** deploy images to a private registry and enforce pull policies.
- **Runtime policy:** enable non-root container policies in Kubernetes or similar.
- **Database credentials:** rotate `DATABASE_URL` regularly; never commit `.env` files.
- **Distroless runtime:** consider switching to a distroless base once all native dependencies are validated.

## Network Isolation

In production, isolate the backend from the frontend using Docker networks:

```bash
docker network create signage-net

docker run -d --name postgres \
  --network signage-net \
  -e POSTGRES_PASSWORD=secret \
  postgres:16-alpine

docker run -d --name signage-backend \
  --network signage-net \
  -p 3001:3001 \
  -e DATABASE_URL=postgresql://postgres:secret@postgres:5432/signage \
  signage-backend:latest
```

Frontend can then reach backend via `http://signage-backend:3001` (DNS resolution within the network).
