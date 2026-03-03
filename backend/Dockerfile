# ════════════════════════════════════════════════════════════════
# Multi-Stage Dockerfile — Backend API
# Build context: repo root
# Stage 1 — Install deps & compile TypeScript
# Stage 2 — Copy only dist + production deps to slim Alpine image
# Result: ~100MB image instead of ~1GB
#
# Note: We use `npm install` (not `npm ci`) because the root
# package-lock.json is a workspace lockfile that can't resolve
# in isolation. CI validates the lockfile; Docker pins via ranges.
# ════════════════════════════════════════════════════════════════

# ── Stage 1: Build ─────────────────────────────────────────────
FROM node:20-alpine AS builder

WORKDIR /app

# Copy backend package.json only
COPY backend/package.json ./

# Install ALL dependencies (including devDependencies for tsc)
RUN npm install

# Copy source code
COPY backend/src/ ./src/
COPY backend/tsconfig.json backend/drizzle.config.ts ./

# Compile TypeScript → JavaScript
RUN npm run build

# ── Stage 2: Production ───────────────────────────────────────
FROM node:20-alpine AS production

# Security: run as non-root user
RUN addgroup -S appgroup && adduser -S appuser -G appgroup

WORKDIR /app

# Copy package.json and install production-only deps
COPY backend/package.json ./
RUN npm install --omit=dev && npm cache clean --force

# Copy compiled JavaScript from builder
COPY --from=builder /app/dist ./dist

# Copy Drizzle config (needed for migrations at startup)
COPY --from=builder /app/drizzle.config.ts ./

# Switch to non-root user
USER appuser

# Expose API port
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=5s --retries=3 \
  CMD wget -qO- http://localhost:3000/api/health || exit 1

# Default: start the API server
CMD ["node", "dist/index.js"]
