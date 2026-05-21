# ── Stage 1: deps ───────────────────────────────────────────
FROM node:22-alpine AS deps
WORKDIR /app
RUN apk add --no-cache python3 make g++
COPY package.json package-lock.json* yarn.lock* ./
RUN npm install --frozen-lockfile 2>/dev/null || npm install

# ── Stage 2: builder ─────────────────────────────────────────
FROM node:22-alpine AS builder
WORKDIR /app
RUN apk add --no-cache python3 make g++
COPY --from=deps /app/node_modules ./node_modules
COPY . .
ENV NEXT_TELEMETRY_DISABLED=1
RUN mkdir -p public && npm run build:plugin-pack || echo "plugin-pack: some plugins skipped"
RUN mkdir -p public && npm run build

# ── Stage 3: runner ──────────────────────────────────────────
FROM node:22-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

RUN apk add --no-cache unzip

RUN addgroup --system --gid 1001 nodejs && \
    adduser  --system --uid 1001 nextjs

RUN mkdir -p public
COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static
COPY --from=builder /app/node_modules/better-sqlite3 ./node_modules/better-sqlite3
COPY --from=builder /app/node_modules/imapflow ./node_modules/imapflow
COPY --from=builder /app/node_modules/socks ./node_modules/socks
COPY --from=builder /app/plugin-pack /app/plugin-pack

USER root
EXPOSE 3000
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"
ENV SELFDASHBOARD_DATA_DIR=/app/data
ENV CROWDSEC_DATA_DIR=/crowdsec-data
ENV SELFDASHBOARD_PLUGINS_MODE=hybrid
ENV SELFDASHBOARD_PLUGIN_PACK_ZIP=/app/plugin-pack/default-plugins.zip
ENV SELFDASHBOARD_PLUGINS_GITHUB_REPO=kabelsalatundklartext/selfdashboard
ENV SELFDASHBOARD_PLUGINS_GITHUB_REF=beta
ENV SELFDASHBOARD_PLUGINS_GITHUB_PATH=plugins-pack

RUN mkdir -p /app/data /crowdsec-data

CMD ["node", "server.js"]
