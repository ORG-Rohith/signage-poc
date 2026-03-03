# Docker / Production

Build the production image (multi-stage Dockerfile is included):

```bash
docker build -t signage-poc:latest .
```

Run the container locally (exposes port 3000):

```bash
docker run --rm -p 3000:3000 --name signage-poc \
  -e NODE_ENV=production \
  signage-poc:latest
```

Run with environment variables from a file (do not commit .env files):

```bash
docker run --rm --env-file .env.prod -p 3000:3000 signage-poc:latest
```

If you prefer building the app locally and running without Docker:

```bash
npm ci
npm run build
npm start
```

## Security & production notes

- Non-root: the container runs as an unprivileged `app` user.
- Reproducible installs: builds use `package-lock.json` and `npm ci`.
- Minimal runtime: multi-stage build keeps dev tooling out of the final image.
- Healthcheck: container exposes a healthcheck for orchestrators.
- Signal handling: `tini` is included for proper signal handling and reaping.

## Recommended next steps for hardening

- Pin base images to immutable digests (e.g., `node:20-alpine@sha256:...`).
- Scan images in CI with `trivy` or `docker scan` and fail on high severity findings.
- Avoid embedding secrets: use a secret manager or your orchestrator's secret facility.
- Use a private registry and deploy with a minimal runtime policy (non-root enforced).
- Consider switching to a distroless runtime once native dependencies are validated.
