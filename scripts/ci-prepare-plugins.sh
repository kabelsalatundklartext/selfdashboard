#!/usr/bin/env sh
# CI: builtin plugin servers live in src/builtin-plugins/ (committed to git).
set -eu

ROOT="$(CDPATH= cd -- "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

if [ -f src/builtin-plugins/weather/server.ts ]; then
  if grep -rq "from ['\"]\\.\\./docker/lib/" src/builtin-plugins/crowdsec/lib 2>/dev/null; then
    echo "ERROR: crowdsec/lib has wrong ../docker import (need ../../docker/lib/)" >&2
    exit 1
  fi
  echo "[SelfDashboard] src/builtin-plugins/ ok"
  exit 0
fi

# Optional refresh when monorepo checkout provides ../plugins (not in isolated Docker)
if [ -f ../plugins/weather/server.ts ] && command -v node >/dev/null 2>&1; then
  echo "[SelfDashboard] Vendoring from ../plugins"
  node scripts/vendor-builtin-plugins.mjs
  exit 0
fi

echo "ERROR: src/builtin-plugins/ is missing." >&2
echo "  Run locally: node scripts/vendor-builtin-plugins.mjs" >&2
echo "  Then commit and push: git add src/builtin-plugins" >&2
exit 1
