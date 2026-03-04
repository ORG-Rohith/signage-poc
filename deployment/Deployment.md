# Deployment Guide

This directory contains the unified Docker Compose configuration for deploying the Signage POC application in production.

## Architecture

The deployment consists of:

- **PostgreSQL** — Database (port 5432, internal only)
- **Backend** — NestJS API (port 3001)
- **Frontend** — Next.js application (port 3000)
- **Nginx** — Reverse proxy/load balancer (ports 80, 443)

All services communicate via a custom Docker bridge network (`signage-network`).

## Prerequisites

- Docker Engine 20.10+
- Docker Compose 2.0+
- Pre-built images for frontend and backend (see Build Images section)

## Setup

### 1. Prepare Environment

Copy the example env file and configure:

```bash
cp .env.example .env
```

Edit `.env` and update:
- `DB_PASSWORD` — PostgreSQL password (change in production!)
- `DB_NAME` — Database name
- `BACKEND_IMAGE` — Backend Docker image reference
- `FRONTEND_IMAGE` — Frontend Docker image reference

### 2. Build Images Locally (or use pre-built)

If running images locally, build them first:

```bash
# Build backend
cd ../backend
docker build -t signage-backend:latest .

# Build frontend
cd ../frontend
docker build -t signage-frontend:latest .

# Return to deployment directory
cd ../deployment
```

Or use pre-built images from a registry by updating `.env`:

```env
BACKEND_IMAGE=myregistry.io/signage-backend:v1.0.0
FRONTEND_IMAGE=myregistry.io/signage-frontend:v1.0.0
```

### 3. Start Services

```bash
docker-compose up -d
```

Check logs:

```bash
docker-compose logs -f
```

Verify all services are healthy:

```bash
docker-compose ps
```

### 4. Access Application

- **Frontend:** http://localhost (via Nginx)
- **Backend API:** http://localhost/api (via Nginx reverse proxy)
- **Backend Direct:** http://localhost:3001

## Database Migrations

If using Prisma, run migrations on first deployment:

```bash
docker-compose exec backend npx prisma migrate deploy
```

## Stopping Services

```bash
docker-compose down
```

To also remove volumes (⚠️ destroys data):

```bash
docker-compose down -v
```

## Maintenance

### View Logs

```bash
# All services
docker-compose logs -f

# Specific service
docker-compose logs -f backend
docker-compose logs -f frontend
docker-compose logs -f postgres
```

### Database Backup

```bash
docker-compose exec postgres pg_dump -U postgres signage_db > backup.sql
```

### Database Restore

```bash
docker-compose exec -T postgres psql -U postgres signage_db < backup.sql
```

### Restart Service

```bash
docker-compose restart backend
docker-compose restart frontend
```

### Pull Latest Images

```bash
docker-compose pull
docker-compose up -d
```

## Nginx Configuration

The nginx configuration file is at `./nginx/nginx.conf`. Modify it to:
- Add SSL/TLS certificates
- Set up proper reverse proxy rules
- Configure rate limiting
- Add security headers

After modifying, reload nginx:

```bash
docker-compose exec nginx nginx -s reload
```

## Scaling (Optional)

To run multiple backend instances:

```bash
docker-compose up -d --scale backend=3
```

Update Nginx config to load-balance across instances.

## Environment Variables Reference

### Backend

- `NODE_ENV` — Set to `production`
- `DATABASE_URL` — PostgreSQL connection (auto-configured)
- `PORT` — Server port (default: 3001)

### Frontend

- `NODE_ENV` — Set to `production`

### Database

- `POSTGRES_USER` — Username (default: postgres)
- `POSTGRES_PASSWORD` — Password (should be changed!)
- `POSTGRES_DB` — Database name (default: signage_db)

## Security Best Practices

1. **Change default database password** in `.env` before production.
2. **Use a private Docker registry** and authenticate with registry credentials.
3. **Enable SSL/TLS** in Nginx (add certificates to `./nginx/`)
4. **Restrict network access** — use firewall rules to limit access.
5. **Regular backups** — schedule automated database backups.
6. **Monitor logs** — aggregate logs to a centralized system.
7. **Keep images updated** — regularly rebuild and redeploy with latest patches.
8. **Never commit `.env`** to version control.

## Troubleshooting

### Backend can't connect to database

Check PostgreSQL service is healthy:

```bash
docker-compose ps postgres
```

Verify `DATABASE_URL` in logs:

```bash
docker-compose logs backend | grep DATABASE_URL
```

### Frontend showing 502 Bad Gateway

Ensure backend is running and healthy:

```bash
docker-compose logs backend
```

Check Nginx logs:

```bash
docker-compose logs nginx
```

### Port conflicts

If port 80 is in use, modify `docker-compose.yml`:

```yaml
nginx:
  ports:
    - "8080:80"  # Use 8080 instead of 80
```

Then access via `http://localhost:8080`

## Support

For issues, check:
- Service logs: `docker-compose logs`
- Docker network: `docker network inspect signage-network`
- File permissions: `docker-compose exec backend ls -la /app/uploads`
