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
RUN mkdir -p public && npm run build && \
    node -e "const fs=require('fs'),path=require('path');const MIN={picomatch:'4.0.4','ip-address':'10.1.1','brace-expansion':'2.0.3'};const BAD={picomatch:'4.0.3','ip-address':'10.1.0','brace-expansion':'2.0.2'};function rv(d){try{return JSON.parse(fs.readFileSync(path.join(d,'package.json'))).version}catch{return null}}function cmp(a,b){const pa=a.split('.').map(Number),pb=b.split('.').map(Number);for(let i=0;i<Math.max(pa.length,pb.length);i++){const d=(pa[i]||0)-(pb[i]||0);if(d)return d}return 0}function*walk(r){if(!fs.existsSync(r))return;for(const e of fs.readdirSync(r,{withFileTypes:true})){if(!e.isDirectory())continue;const p=path.join(r,e.name);if(e.name==='node_modules'){yield*walk(p);continue}if(fs.existsSync(path.join(p,'package.json')))yield p;const n=path.join(p,'node_modules');if(fs.existsSync(n))yield*walk(n)}}const roots=['/app/.next/standalone','/app/node_modules'];const fail=[];for(const root of roots){for(const dir of walk(root)){const name=path.basename(dir);if(!MIN[name])continue;const v=rv(dir);if(!v)continue;if(v===BAD[name]||cmp(v,MIN[name])<0)fail.push(name+' '+v+' @ '+dir)}}if(fail.length){console.error('harden verify FAILED:',fail.join('; '));process.exit(1)}console.log('harden verify OK')"

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

# Grype scannt /app/node_modules im Runner (nicht .next/standalone) — Next-Bundle picomatch 4.0.3 ersetzen
COPY --from=builder /app/node_modules/picomatch ./node_modules/picomatch
COPY --from=builder /app/scripts/harden-standalone-deps.mjs /tmp/harden-standalone-deps.mjs
RUN node /tmp/harden-standalone-deps.mjs && rm -f /tmp/harden-standalone-deps.mjs

# Root: bind-mounted /var/run/docker.sock is owned by host root:docker — non-root often gets EACCES without --group-add.
USER root
EXPOSE 3000
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"
ENV SELFDASHBOARD_DATA_DIR=/app/data
ENV CROWDSEC_DATA_DIR=/crowdsec-data

RUN mkdir -p /app/data /crowdsec-data

CMD ["node", "server.js"]
