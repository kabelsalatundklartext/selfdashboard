#!/usr/bin/env sh
# Ensures plugins/ exists before Docker build (GitHub Actions or local).
set -eu

ROOT="$(CDPATH= cd -- "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

if [ -f plugins/weather/server.ts ]; then
  echo "[SelfDashboard] plugins/ already present"
  exit 0
fi

# Monorepo layout on disk (not inside Docker)
if [ -f ../plugins/weather/server.ts ]; then
  echo "[SelfDashboard] Copy ../plugins → ./plugins"
  rm -rf plugins
  cp -a ../plugins ./plugins
  exit 0
fi

# plugins/ committed in this repository (extract from git index)
BRANCH="${GITHUB_REF_NAME:-beta}"
if git rev-parse "origin/${BRANCH}" >/dev/null 2>&1 && \
   git cat-file -e "origin/${BRANCH}:plugins/weather/server.ts" 2>/dev/null; then
  echo "[SelfDashboard] Extract plugins/ from origin/${BRANCH}"
  git archive "origin/${BRANCH}" plugins | tar -x -C "$ROOT"
  exit 0
fi

echo "ERROR: plugins/ is missing." >&2
echo "  Commit plugin sources under selfdashboard/plugins/ (copy from dev monorepo), OR" >&2
echo "  use a monorepo checkout with selfdashboard/ + plugins/ as siblings." >&2
exit 1
