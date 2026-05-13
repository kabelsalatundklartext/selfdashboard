#!/usr/bin/env bash
#
# ═══════════════════════════════════════════════════════════════════════════
# SelfDashboard — ALLES IN EINEM für Unraid „User Scripts“
# ═══════════════════════════════════════════════════════════════════════════
#
# SO NUTZT DU ES (Anfänger):
#   1) Unraid → Plugins → User Scripts → „Add new script“
#   2) Den KOMPLETTEN Inhalt dieser Datei in das Script-Feld KOPIEREN (alles ab
#      der Zeile „#!/usr/bin/env bash“ unten bis Dateiende).
#   3) Schedule / Ausführung: „At First Array Start Only“ (Array-Start)
#      → Dann läuft im Hintergrund alle paar Sekunden das Update.
#      (Du musst KEINE extra .sh auf den Flash legen.)
#
#   4) Im SelfDashboard-Unraid-Widget bei „JSON-URL“ eintragen:
#        https://DEIN-HOSTNAME-ODER-IP/net-stats.json
#      Wenn Schreiben nach /usr/local/emhttp/web/ fehlschlägt: OUT_FILE z. B. auf einen Share legen:
#        OUT_FILE=/mnt/user/appdata/selfdashboard/net-stats.json
#      (Ordner vorher anlegen; ggf. per Nginx/alias für die URL sorgen.)
#
# STOPPEN: Reboot / Array stop, oder per SSH:
#   kill "$(cat /tmp/selfdashboard-net-json.pid 2>/dev/null)" 2>/dev/null || true
#
# ═══════════════════════════════════════════════════════════════════════════

set -euo pipefail

# ── Konfiguration (hier nur diese Werte anpassen) ─────────────────────────
IFACE="${IFACE:-br0}"                    # meist br0
SLEEP_SEC="${SLEEP_SEC:-3}"             # Pause zwischen zwei Messungen (Sekunden)
OUT_FILE="${OUT_FILE:-/usr/local/emhttp/web/net-stats.json}"

# linkMbps: leer = ethtool; auf Bridges oft leer → dann Fallback 1000 Mbit/s
LINK_MBPS="${LINK_MBPS:-}"              # z. B. 1000 / 2500 / 10000
ETH_PHYS="${ETH_PHYS:-}"                # z. B. enp3s0 wenn ethtool auf br0 nicht geht

# Zeit zwischen zwei /proc/net/dev-Ablesungen innerhalb EINER Messung (≥1)
SAMPLE_SEC="${SAMPLE_SEC:-1}"

# Lock gegen doppelte Hintergrund-Schleife
LOCK_FILE="${LOCK_FILE:-/tmp/selfdashboard-net-json.lock}"
PID_FILE="${PID_FILE:-/tmp/selfdashboard-net-json.pid}"

# ── Hilfsfunktionen (normalerweise nichts ändern) ───────────────────────────

read_rx_tx() {
  local dev="$1"
  awk -v d="${dev}:" '
    BEGIN { f = 0 }
    $1 == d { print ($2 + 0) " " ($10 + 0); f = 1; exit }
    END { if (!f) print "0 0" }
  ' /proc/net/dev
}

link_mbps_from_ethtool() {
  local iface="$1"
  local line
  line="$(ethtool "$iface" 2>/dev/null | grep -i '^[[:space:]]*Speed:' | head -n1 || true)"
  if [[ "$line" =~ Speed:[[:space:]]*([0-9]+)Mb/s ]]; then
    echo "${BASH_REMATCH[1]}"
    return 0
  fi
  return 1
}

resolve_link_mbps() {
  local m
  if [[ -n "$LINK_MBPS" ]] && [[ "$LINK_MBPS" =~ ^[0-9]+$ ]]; then
    echo "$LINK_MBPS"
    return 0
  fi
  m="$(link_mbps_from_ethtool "$IFACE" 2>/dev/null || true)"
  if [[ -n "$m" ]]; then
    echo "$m"
    return 0
  fi
  if [[ -n "$ETH_PHYS" ]]; then
    m="$(link_mbps_from_ethtool "$ETH_PHYS" 2>/dev/null || true)"
    if [[ -n "$m" ]]; then
      echo "$m"
      return 0
    fi
  fi
  echo "1000"
}

write_net_json_once() {
  read -r rx1 tx1 < <(read_rx_tx "$IFACE")
  sleep "$SAMPLE_SEC"
  read -r rx2 tx2 < <(read_rx_tx "$IFACE")

  local rx_bps tx_bps link_mbps json dir tmp
  rx_bps=$(( (rx2 - rx1) / SAMPLE_SEC ))
  tx_bps=$(( (tx2 - tx1) / SAMPLE_SEC ))
  if (( rx_bps < 0 )); then rx_bps=0; fi
  if (( tx_bps < 0 )); then tx_bps=0; fi

  link_mbps="$(resolve_link_mbps)"
  json="$(printf '{"rxBps":%s,"txBps":%s,"linkMbps":%s}' "$rx_bps" "$tx_bps" "$link_mbps")"

  dir="$(dirname "$OUT_FILE")"
  mkdir -p "$dir" || {
    echo "selfdashboard-net-json: Zielordner fehlt/nicht anlegbar: $dir — OUT_FILE anpassen (z. B. /mnt/user/selfdashboard/net-stats.json)." >&2
    return 1
  }

  # Temp unter /tmp (existiert immer), dann mv — vermeidet „No such file“ wenn web-Ordner timing/readonly ist
  tmp="$(mktemp /tmp/selfdashboard-net-json.XXXXXX)"
  if ! printf '%s\n' "$json" >"$tmp"; then rm -f "$tmp"; return 1; fi
  if ! mv -f "$tmp" "$OUT_FILE"; then rm -f "$tmp"; return 1; fi
}

# ── Start: eine Instanz, dann Dauerschleife ─────────────────────────────────

if ! command -v awk >/dev/null 2>&1 || ! command -v ethtool >/dev/null 2>&1; then
  echo "selfdashboard-net-json: awk oder ethtool fehlt." >&2
  exit 1
fi

# Hintergrund: User Scripts würde sonst ewig „hängen“, bis die Schleife endet
(
  exec 9>"$LOCK_FILE"
  if ! flock -n 9; then exit 0; fi
  echo "${BASHPID:-$$}" >"$PID_FILE"
  while true; do
    write_net_json_once || true
    sleep "$SLEEP_SEC"
  done
) &

# Prozess-Name nur zur Orientierung beim Stoppen (siehe Header)
echo "selfdashboard-net-json: Hintergrund gestartet (JSON → ${OUT_FILE})." >&2

exit 0
