# syntax=docker/dockerfile:1.4
### BuildIR stage: installs deps, runs prisma migrations, builds the NestJS app
FROM node:20-alpine AS builder
WORKDIR /app

# Copy lockfile first for reproducible installs and layer caching
COPY package.json package-lock.json ./

# Install build tooling and all dependencies (dev + prod for build)
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

# Copy built app from builder
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/prisma ./prisma

# Create uploads directory for file uploads
RUN mkdir -p uploads && chown -R app:app /app

# Ensure all files are owned by the non-root user
RUN chown -R app:app /app
USER app

EXPOSE 3001

# Simple healthcheck probing the application
HEALTHCHECK --interval=30s --timeout=3s --start-period=10s --retries=3 \
  CMD curl -fS http://localhost:3001/ || exit 1

# Use tini to handle signals correctly
ENTRYPOINT ["/sbin/tini", "--"]
CMD ["node", "dist/main.js"]