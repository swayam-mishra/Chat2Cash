# ════════════════════════════════════════════════════════════════
# Phase 4: Multi-Stage Dockerfile
# Stage 1 — Install deps & compile TypeScript
# Stage 2 — Copy only dist + production deps to slim Alpine image
# Result: ~100MB image instead of ~1GB
# ════════════════════════════════════════════════════════════════

# ── Stage 1: Build ─────────────────────────────────────────────
FROM node:20-alpine AS builder

WORKDIR /app

# Copy package files first for Docker layer caching
COPY package.json package-lock.json tsconfig.json drizzle.config.ts ./

# Install ALL dependencies (including devDependencies for tsc)
RUN npm ci

# Copy source code
COPY src/ ./src/

# Compile TypeScript → JavaScript
RUN npm run build

# ── Stage 2: Production ───────────────────────────────────────
FROM node:20-alpine AS production

# Security: run as non-root user
RUN addgroup -S appgroup && adduser -S appuser -G appgroup

WORKDIR /app

# Copy package files and install production-only deps
COPY package.json package-lock.json ./
RUN npm ci --omit=dev && npm cache clean --force

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
