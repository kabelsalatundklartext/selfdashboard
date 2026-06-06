# OPNsense

Zeigt den Status einer [OPNsense](https://opnsense.org/)-Firewall:
Produktname + Version, Update-Status (Badge „Update verfügbar" / „Aktuell")
und die Gateways mit Up/Down-Punkt und Latenz.

## Setup

1. **API-Schlüssel erzeugen:** OPNsense → **System → Zugang → Benutzer** →
   Benutzer öffnen → Abschnitt **API-Schlüssel** → „+" klicken.
   OPNsense lädt eine Datei mit `key` und `secret` herunter — das Secret wird nur einmal angezeigt.
2. Widget-Einstellungen: **Basis-URL** (z. B. `https://192.168.1.1`), **API-Key** und
   **API-Secret** eintragen.
3. OPNsense nutzt meist HTTPS mit selbstsigniertem Zertifikat — die Option
   **„Selbstsigniertes Zertifikat erlauben"** ist daher standardmäßig aktiviert.
   Bei gültigem Zertifikat (z. B. Let's Encrypt) kann sie deaktiviert werden.
4. Optional: Widget-Titel anpassen (leer = ausblenden), Aktualisierungsintervall (Standard 60 s).

Die Abfrage läuft **serverseitig** (`/api/plugins/opnsense`) mit SSRF-Schutz;
das API-Secret wird verschlüsselt gespeichert. Verwendete Endpunkte:
`/api/core/firmware/status` (Version + Updates) und `/api/routes/gateway/status` (Gateways, optional).

> Beta-Hinweis: Bei abweichenden API-Antworten bitte Issue mit
> OPNsense-Version + Antwort-JSON melden.

---

# OPNsense (English)

Shows the status of an OPNsense firewall: product name + version, update status
(badge "Update available" / "Up to date") and gateways with up/down dot and latency.

1. **Create an API key:** OPNsense → **System → Access → Users** →
   open the user → **API keys** section → click "+".
   OPNsense downloads a file with `key` and `secret` — the secret is shown only once.
2. Widget settings: enter **base URL** (e.g. `https://192.168.1.1`), **API key** and **API secret**.
3. OPNsense usually runs HTTPS with a self-signed certificate — the option
   **"Allow self-signed certificate"** is enabled by default.
   Disable it if you use a valid certificate (e.g. Let's Encrypt).
4. Optional: widget title (empty = hidden), refresh interval (default 60 s).

Requests run server-side with SSRF protection; the API secret is stored encrypted.
Endpoints used: `/api/core/firmware/status` and `/api/routes/gateway/status` (optional).

> Beta note: please report issues with your OPNsense version + response JSON.
