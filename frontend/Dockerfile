# syntax=docker/dockerfile:1.4
### Builder stage: installs deps and builds the Next.js app
FROM node:20-alpine AS builder
WORKDIR /app

# Copy lockfile first for reproducible installs and layer caching
COPY package.json package-lock.json ./

# Install build tooling and dependencies. Keep build tools only in this stage.
RUN apk add --no-cache python3 make g++ git \
  && npm ci \
  && apk del git

# Copy source and build
COPY . .
RUN npm run build


### Runtime stage: minimal image with production dependencies only
FROM node:20-alpine AS runner
ENV NODE_ENV=production
WORKDIR /app

# Create an unprivileged user to run the app
RUN addgroup -S appgroup && adduser -S app -G appgroup

# Copy package files and install only production dependencies
COPY package.json package-lock.json ./
RUN apk add --no-cache tini curl \
  && npm ci --omit=dev --production

# Copy built app and public assets from builder
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/public ./public

# Copy next config if present (not required at runtime but harmless)
# COPY --from=builder /app/next.config.* ./ 2>/dev/null || true
COPY --from=builder /app/next.config.js ./
# Ensure files are owned by the non-root user
RUN chown -R app:appgroup /app
USER app

EXPOSE 3000

# Small healthcheck probing local server
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD curl -fS http://localhost:3000/ || exit 1

# Use tini to handle signals correctly and run in the shell form to use npm script
ENTRYPOINT ["/sbin/tini", "--"]
CMD ["npm", "run", "start"]
