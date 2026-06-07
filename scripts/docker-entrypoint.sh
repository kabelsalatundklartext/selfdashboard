#!/bin/sh
# SelfDashboard container entrypoint.
#
# Starts as root, optionally remaps the app user to PUID/PGID, fixes ownership
# of the writable volume mounts, then drops privileges and runs the app.
#
# Run SelfDashboard with the SAME PUID/PGID as CrowdSec (Unraid default 99/100)
# so it can read crowdsec.db directly as the owner — survives nightly backups
# that restart CrowdSec, no chmod needed.
#
# Opt-outs / tuning:
#   PUID / PGID                              — run the app as this uid/gid (default 1001)
#   SELFDASHBOARD_SKIP_CHOWN=1               — never touch ownership
#   SELFDASHBOARD_FIX_CROWDSEC_PERMS=0       — don't add read perms on /crowdsec-data
#   SELFDASHBOARD_CROWDSEC_PERMS_INTERVAL=N  — re-chmod crowdsec data every N s (default 120; 0 = one-shot)
set -e

APP_UID="${PUID:-1001}"
APP_GID="${PGID:-1001}"

if [ "$(id -u)" = "0" ]; then
  # Remap the named nextjs/nodejs user+group to the requested ids, so su-exec
  # keeps the named user (and its supplementary groups, e.g. docker).
  CUR_UID="$(id -u nextjs 2>/dev/null || echo 1001)"
  CUR_GID="$(id -g nextjs 2>/dev/null || echo 1001)"
  if [ "$APP_GID" != "$CUR_GID" ]; then
    sed -i "s/^nodejs:x:[0-9]*:/nodejs:x:${APP_GID}:/" /etc/group 2>/dev/null || true
    sed -i "s/^\(nextjs:x:[0-9]*\):[0-9]*:/\1:${APP_GID}:/" /etc/passwd 2>/dev/null || true
  fi
  if [ "$APP_UID" != "$CUR_UID" ]; then
    sed -i "s/^nextjs:x:[0-9]*:/nextjs:x:${APP_UID}:/" /etc/passwd 2>/dev/null || true
  fi

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

  # CrowdSec DB mount is owned by the CrowdSec container (often root:root 0600).
  # A one-shot chmod at start loses the race when nightly backups stop/restart
  # CrowdSec: SelfDashboard may boot before CrowdSec recreates the DB, then the
  # fresh DB is unreadable again ("unable to open database file"). So we add read
  # perms once AND, as root, re-apply them periodically in the background — this
  # survives the nightly recreate regardless of which user CrowdSec runs as.
  #   SELFDASHBOARD_FIX_CROWDSEC_PERMS=0          — disable entirely
  #   SELFDASHBOARD_CROWDSEC_PERMS_INTERVAL=0     — one-shot only (no background loop)
  CS_DIR="${CROWDSEC_DATA_DIR:-/crowdsec-data}"
  if [ "${SELFDASHBOARD_FIX_CROWDSEC_PERMS:-1}" = "1" ] && [ -d "$CS_DIR" ]; then
    chmod -R a+rX "$CS_DIR" 2>/dev/null || true
    CS_INT="${SELFDASHBOARD_CROWDSEC_PERMS_INTERVAL:-120}"
    if [ "$CS_INT" -gt 0 ] 2>/dev/null; then
      # Forked before privilege drop → keeps running as root after exec su-exec.
      ( while sleep "$CS_INT"; do chmod -R a+rX "$CS_DIR" 2>/dev/null || true; done ) &
      echo "[entrypoint] crowdsec perms: re-chmod a+rX $CS_DIR every ${CS_INT}s (root)"
    fi
  fi

  # Docker socket (optional mount): give the app user the socket's group.
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

  echo "[entrypoint] running as ${APP_UID}:${APP_GID}"
  # Named user so su-exec applies supplementary groups (initgroups).
  exec su-exec nextjs "$@"
fi

exec "$@"
