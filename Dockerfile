# ── Stage 1: deps ───────────────────────────────────────────
FROM node:22-alpine3.23 AS deps
WORKDIR /app
RUN apk update && apk add --no-cache python3 make g++ && apk upgrade --no-cache
COPY package.json package-lock.json* yarn.lock* ./
RUN npm install --frozen-lockfile 2>/dev/null || npm install

# ── Stage 2: builder ─────────────────────────────────────────
FROM node:22-alpine3.23 AS builder
WORKDIR /app
RUN apk update && apk add --no-cache python3 make g++ && apk upgrade --no-cache
COPY --from=deps /app/node_modules ./node_modules
COPY . .
ENV NEXT_TELEMETRY_DISABLED=1
RUN mkdir -p public && npm run build

# ── Stage 3: runner ──────────────────────────────────────────
FROM node:22-alpine3.23 AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

RUN apk update && apk upgrade --no-cache

RUN addgroup --system --gid 1001 nodejs && \
    adduser  --system --uid 1001 nextjs

RUN mkdir -p public
COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static
COPY --from=builder /app/node_modules/better-sqlite3 ./node_modules/better-sqlite3

# serverExternalPackages: Laufzeit-Module neben standalone (ip-address liegt unter socks/)
COPY --from=builder /app/node_modules/imapflow ./node_modules/imapflow
COPY --from=builder /app/node_modules/socks ./node_modules/socks

# Root: bind-mounted /var/run/docker.sock is owned by host root:docker — non-root often gets EACCES without --group-add.
USER root
EXPOSE 3000
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"
ENV SELFDASHBOARD_DATA_DIR=/app/data
ENV CROWDSEC_DATA_DIR=/crowdsec-data

RUN mkdir -p /app/data /crowdsec-data

CMD ["node", "server.js"]
