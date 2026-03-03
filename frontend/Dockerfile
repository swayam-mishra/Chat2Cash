# ── Frontend Dockerfile ─────────────────────────────────────
# Build context: repo root (so we can access package-lock.json)
# Stage 1: Build — install deps & compile with Vite
# Stage 2: Serve — lightweight nginx to serve static files
# ────────────────────────────────────────────────────────────

# ── Stage 1: Build ─────────────────────────────────────────
FROM node:20-alpine AS builder

WORKDIR /app

# Copy root lockfile + frontend package files for deterministic install
COPY package-lock.json ./
COPY frontend/package.json ./
RUN npm ci

# Copy source + config, then build
COPY frontend/ ./
RUN npm run build

# ── Stage 2: Serve ─────────────────────────────────────────
FROM nginx:alpine AS production

# Copy built assets to nginx
COPY --from=builder /app/dist /usr/share/nginx/html

# SPA fallback: route all paths to index.html
RUN printf 'server {\n  listen 5173;\n  root /usr/share/nginx/html;\n  location / {\n    try_files $uri $uri/ /index.html;\n  }\n  location /api {\n    proxy_pass http://api:3000;\n    proxy_set_header Host $host;\n    proxy_set_header X-Real-IP $remote_addr;\n  }\n}\n' > /etc/nginx/conf.d/default.conf

EXPOSE 5173

CMD ["nginx", "-g", "daemon off;"]
