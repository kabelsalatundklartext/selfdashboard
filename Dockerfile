# ─── Stage 1: Python deps ────────────────────────────────────────────────────
FROM python:3.12-slim AS python-deps
WORKDIR /app
COPY backend-python/requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# ─── Stage 2: Node deps ──────────────────────────────────────────────────────
FROM node:20-alpine AS node-deps
WORKDIR /app
COPY backend-node/package.json .
RUN npm install --production && npm cache clean --force

# ─── Stage 3: Final image ────────────────────────────────────────────────────
FROM python:3.12-slim

LABEL org.opencontainers.image.source=https://github.com/kabelsalatundklartext/selfdashboard
LABEL org.opencontainers.image.description="Self-hosted Home Server Dashboard for Unraid"
LABEL org.opencontainers.image.licenses=MIT

# Install Node.js + nginx + supervisor
RUN apt-get update && apt-get install -y --no-install-recommends \
    nginx \
    supervisor \
    curl \
    tzdata \
    && curl -fsSL https://deb.nodesource.com/setup_20.x | bash - \
    && apt-get install -y --no-install-recommends nodejs \
    && apt-get clean && rm -rf /var/lib/apt/lists/*

# Python packages from stage 1
COPY --from=python-deps /usr/local/lib/python3.12/site-packages /usr/local/lib/python3.12/site-packages
COPY --from=python-deps /usr/local/bin/uvicorn /usr/local/bin/uvicorn

# Node packages from stage 2
WORKDIR /app
COPY --from=node-deps /app/node_modules ./node_modules

# App source
COPY backend-node/ ./backend-node/
COPY backend-python/ ./backend-python/
COPY frontend/ /usr/share/nginx/html/
COPY nginx/nginx.conf /etc/nginx/nginx.conf

# Supervisor config — runs nginx + node + python in one container
COPY docker/supervisord.conf /etc/supervisor/conf.d/supervisord.conf

RUN mkdir -p /data /var/log/supervisor

EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=10s --start-period=15s --retries=3 \
  CMD curl -f http://localhost:3000/api/health || exit 1

ENV NODE_ENV=production \
    PORT_NODE=4000 \
    PORT_PYTHON=4001 \
    DATA_DIR=/data \
    HOST_PROC=/host/proc \
    HOST_SYS=/host/sys

CMD ["/usr/bin/supervisord", "-c", "/etc/supervisor/conf.d/supervisord.conf"]
