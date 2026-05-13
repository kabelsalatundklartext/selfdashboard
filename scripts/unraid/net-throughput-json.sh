#!/usr/bin/env bash
#
# SelfDashboard Unraid-Plugin: JSON für „Durchsatz-URL“
# ------------------------------------------------------
# Liefert rxBps / txBps aus /proc/net/dev (Differenz über INTERVAL Sekunden)
# und optional linkMbps aus ethtool (Portgeschwindigkeit, z. B. 1000 / 2500 / 10000).
#
# Voraussetzungen: bash, awk, ethtool (üblich auf Unraid), sleep
#
# Nutzung (einmalig testen):
#   chmod +x net-throughput-json.sh
#   IFACE=br0 ./net-throughput-json.sh
#
# Anfänger ohne Datei auf Unraid: komplett  NET-STATS-USER-SCRIPT-PASTE.sh  in
# „User Scripts“ einfügen (siehe Kommentar dort).
#
# Dauerhaft z. B. per „User Scripts“ Plugin in eine Datei schreiben:
#   IFACE=br0 INTERVAL=2 OUTPUT=/usr/local/emhttp/web/net-stats.json ./net-throughput-json.sh
#
# Nginx (Beispiel, nur wenn du die Datei per HTTPS ausliefern willst):
#   location = /net-stats.json { alias /usr/local/emhttp/web/net-stats.json; add_header Access-Control-Allow-Origin *; }
#
# SelfDashboard-JSON-URL dann z. B.: https://DEIN-TOWER/net-stats.json
#
set -euo pipefail

IFACE="${IFACE:-br0}"
INTERVAL="${INTERVAL:-1}"
OUTPUT="${OUTPUT:-}"
# Falls ethtool auf der Bridge nichts liefert: physische NIC setzen, z. B. ETH_PHYS=enp3s0
ETH_PHYS="${ETH_PHYS:-}"
# Manuell Mbit/s erzwingen (überschreibt ethtool), z. B. LINK_MBPS=10000
LINK_MBPS="${LINK_MBPS:-}"

read_rx_tx() {
  local dev="$1"
  # $1 ist z. B. br0: — RX-Bytes $2, TX-Bytes $10
  awk -v d="${dev}:" '
    BEGIN { f = 0 }
    $1 == d { print ($2 + 0) " " ($10 + 0); f = 1; exit }
    END { if (!f) print "0 0" }
  ' /proc/net/dev
}

# Gibt nur bei erkanntem „…Mb/s“ eine Zahl aus (kein stderr), sonst leer + RC 1
link_mbps_from_ethtool() {
  local iface="$1"
  local line
  line="$(ethtool "$iface" 2>/dev/null | grep -i '^[[:space:]]*Speed:' | head -n1 || true)"
  # typisch: Speed: 2500Mb/s  |  Speed: 10000Mb/s  |  Speed: 100Mb/s  |  Speed: Unknown!
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
  # Fallback: 1 Gbit — nur damit Balken nicht leer bleiben; besser LINK_MBPS oder ETH_PHYS setzen
  echo "1000"
}

read -r rx1 tx1 < <(read_rx_tx "$IFACE")
sleep "$INTERVAL"
read -r rx2 tx2 < <(read_rx_tx "$IFACE")

# Ganzzahlige Bytes/s (bash arithmetik)
rx_bps=$(( (rx2 - rx1) / INTERVAL ))
tx_bps=$(( (tx2 - tx1) / INTERVAL ))

# Counter-Überlauf / Reset (sehr selten): nicht negativ ausgeben
if (( rx_bps < 0 )); then rx_bps=0; fi
if (( tx_bps < 0 )); then tx_bps=0; fi

link_mbps="$(resolve_link_mbps)"

# Hinweis: $( ) entfernt trailing newlines — JSON ohne \n bauen, Ausgabe mit explizitem \n
json="$(printf '{"rxBps":%s,"txBps":%s,"linkMbps":%s}' "$rx_bps" "$tx_bps" "$link_mbps")"

if [[ -n "$OUTPUT" ]]; then
  dir="$(dirname "$OUTPUT")"
  mkdir -p "$dir" || {
    echo "net-throughput-json.sh: Zielordner fehlt/nicht anlegbar: $dir" >&2
    exit 1
  }
  tmp="$(mktemp /tmp/net-throughput-json.XXXXXX)"
  if ! printf '%s\n' "$json" >"$tmp"; then rm -f "$tmp"; exit 1; fi
  if ! mv -f "$tmp" "$OUTPUT"; then rm -f "$tmp"; exit 1; fi
else
  printf '%s\n' "$json"
fi
