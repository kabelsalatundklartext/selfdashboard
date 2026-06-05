#!/bin/sh
# SelfDashboard container entrypoint.
#
# Starts as root, fixes ownership of the writable volume mounts once
# (existing installs predate the non-root image), then drops privileges
# and runs the app as nextjs (1001) — LinuxServer-style.
#
# Opt-outs:
#   SELFDASHBOARD_SKIP_CHOWN=1          — never touch ownership
#   SELFDASHBOARD_FIX_CROWDSEC_PERMS=0  — don't add read perms on /crowdsec-data
set -e

APP_UID=1001
APP_GID=1001

if [ "$(id -u)" = "0" ]; then
  if [ "${SELFDASHBOARD_SKIP_CHOWN:-0}" != "1" ]; then
    for d in "${SELFDASHBOARD_DATA_DIR:-/app/data}" /app/plugins/custom; do
      mkdir -p "$d" 2>/dev/null || true
      # Only recurse when the top-level owner is wrong (fast on every boot after the first).
      if [ -d "$d" ] && [ "$(stat -c %u "$d" 2>/dev/null)" != "$APP_UID" ]; then
        echo "[entrypoint] chown -R ${APP_UID}:${APP_GID} $d"
        chown -R "$APP_UID:$APP_GID" "$d" 2>/dev/null || true
      fi
    done
  fi

  # CrowdSec DB mount is read-only for us and owned by the CrowdSec container —
  # don't chown, just make sure the app user can read it (best effort).
  CS_DIR="${CROWDSEC_DATA_DIR:-/crowdsec-data}"
  if [ "${SELFDASHBOARD_FIX_CROWDSEC_PERMS:-1}" = "1" ] && [ -d "$CS_DIR" ]; then
    chmod -R a+rX "$CS_DIR" 2>/dev/null || true
  fi

  exec su-exec "$APP_UID:$APP_GID" "$@"
fi

exec "$@"
