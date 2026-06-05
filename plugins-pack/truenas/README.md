# TrueNAS

Zeigt Systeminfo (Hostname, Version, Uptime) und den Status aller Storage-Pools
aus der TrueNAS-REST-API (`/api/v2.0/system/info` + `/api/v2.0/pool`).
Funktioniert mit TrueNAS CORE und SCALE.

## Setup

1. TrueNAS-Weboberfläche → **Einstellungen (Zahnrad oben rechts) → API Keys** → **Add** → Key anlegen
   und den angezeigten Schlüssel kopieren (wird nur einmal angezeigt).
2. Widget-Einstellungen:
   - **Basis-URL**, z. B. `https://192.168.1.70` (die Web-UI-Adresse).
   - **API-Key** einfügen.
   - **Selbstsigniertes Zertifikat erlauben** ist standardmäßig aktiv — TrueNAS nutzt ab Werk ein
     selbstsigniertes Zertifikat.
3. Optional: Widget-Titel (leer = ausblenden), Aktualisierungsintervall (Standard 60 s).

Die Abfrage läuft **serverseitig** (`/api/plugins/truenas`) mit SSRF-Schutz;
der API-Key wird verschlüsselt gespeichert.

> **Beta-Hinweis:** Getestet gegen TrueNAS SCALE; Felder werden defensiv gelesen.
> Bei abweichenden API-Antworten bitte Issue mit TrueNAS-Version + Antwort-JSON melden.

---

# TrueNAS (English)

Shows system info (hostname, version, uptime) and the status of all storage pools
from the TrueNAS REST API (`/api/v2.0/system/info` + `/api/v2.0/pool`).
Works with TrueNAS CORE and SCALE.

1. TrueNAS web UI → **Settings (gear icon, top right) → API Keys** → **Add** → create a key
   and copy it (shown only once).
2. Widget settings:
   - **Base URL**, e.g. `https://192.168.1.70` (the web UI address).
   - Paste the **API key**.
   - **Allow self-signed certificate** is enabled by default — TrueNAS ships with a self-signed cert.
3. Optional: widget title (empty = hidden), refresh interval (default 60 s).

Requests run server-side with SSRF protection; the API key is stored encrypted.

> **Beta note:** Tested against TrueNAS SCALE; fields are read defensively.
> If the API responds differently for you, please open an issue with your TrueNAS version + response JSON.
