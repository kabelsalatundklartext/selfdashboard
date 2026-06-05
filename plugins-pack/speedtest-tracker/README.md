# Speedtest Tracker

Zeigt den letzten Speedtest aus [Speedtest Tracker](https://docs.speedtest-tracker.dev/):
Download, Upload, Ping, Zeitpunkt und Test-Server.

## Setup

1. Speedtest Tracker → **Einstellungen → API Tokens** → Token erstellen (bei neueren Versionen Pflicht).
2. Widget-Einstellungen: **Basis-URL** (z. B. `http://192.168.1.30:8765`) + **API-Token** eintragen.
3. Optional: Widget-Titel anpassen, Aktualisierungsintervall (Standard 5 Min — Speedtests laufen ja nicht sekündlich).

Die Abfrage läuft **serverseitig** (`/api/plugins/speedtest-tracker`) mit SSRF-Schutz;
der Token wird verschlüsselt gespeichert. Unterstützt werden die API-Pfade
`/api/v1/results/latest` (aktuelle Versionen) und `/api/speedtest/latest` (ältere).

> Beta-Hinweis: Bei abweichenden API-Antworten bitte Issue mit
> Speedtest-Tracker-Version + Antwort-JSON melden.

---

# Speedtest Tracker (English)

Shows the latest result from Speedtest Tracker: download, upload, ping, timestamp, test server.

1. Speedtest Tracker → **Settings → API Tokens** → create a token (required on newer versions).
2. Widget settings: enter **base URL** + **API token**.
3. Optional: widget title, refresh interval (default 5 min).

Requests run server-side with SSRF protection; the token is stored encrypted.
Supported endpoints: `/api/v1/results/latest` (current) and `/api/speedtest/latest` (legacy).
