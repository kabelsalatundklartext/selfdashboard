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

  # Docker socket (optional mount, Docker/CrowdSec plugins): the app user needs
  # the socket's group. Resolve its GID and add nextjs to that group — no
  # --group-add needed in the template.
  DOCKER_SOCK="/var/run/docker.sock"
  if [ -S "$DOCKER_SOCK" ]; then
    SOCK_GID="$(stat -c %g "$DOCKER_SOCK" 2>/dev/null || echo '')"
    if [ -n "$SOCK_GID" ] && [ "$SOCK_GID" != "0" ]; then
      if ! getent group "$SOCK_GID" >/dev/null 2>&1; then
        addgroup -g "$SOCK_GID" docker-sock 2>/dev/null || true
      fi
      SOCK_GRP="$(getent group "$SOCK_GID" | cut -d: -f1)"
      if [ -n "$SOCK_GRP" ]; then
        addgroup nextjs "$SOCK_GRP" 2>/dev/null || true
        echo "[entrypoint] docker.sock group ${SOCK_GRP} (gid ${SOCK_GID}) -> nextjs"
      fi
    elif [ "$SOCK_GID" = "0" ]; then
      echo "[entrypoint] docker.sock has gid 0 — grant access via --group-add or socket permissions" >&2
    fi
  fi

  # Run as the named user so su-exec picks up supplementary groups (initgroups).
  exec su-exec nextjs "$@"
fi

exec "$@"
