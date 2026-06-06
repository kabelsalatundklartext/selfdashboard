# OpenMediaVault

Zeigt Systeminfos aus [OpenMediaVault](https://www.openmediavault.org/):
**Hostname, Version, Uptime, CPU- und RAM-Last, Load Average** — per OMV-RPC
(`/rpc.php`, `session.login` + `system.getInformation`).

## Setup

1. Das Plugin nutzt den **Web-UI-Login** von OMV — also `admin` oder ein
   eigener Benutzer mit Zugriff auf die Web-Oberfläche.
2. Widget-Einstellungen: **Basis-URL** (z. B. `http://192.168.1.90`),
   **Benutzername** (Standard `admin`) und **Passwort** eintragen.
3. Bei HTTPS mit selbstsigniertem Zertifikat die Checkbox
   **„Selbstsigniertes Zertifikat erlauben“** aktiviert lassen (Standard).

Die Abfrage läuft **serverseitig** (`/api/plugins/openmediavault`) mit SSRF-Schutz;
das Passwort wird verschlüsselt gespeichert.

> **Beta-Hinweis:** Die Felder der RPC-Antwort (`system.getInformation`)
> **variieren je OMV-Version** — das Plugin parst sie defensiv und blendet
> fehlende Werte aus. Wenn CPU/RAM/Uptime bei dir leer bleiben:
> bitte Feedback/Issue **mit OMV-Version** (und gern dem Antwort-JSON) melden.

---

# OpenMediaVault (English)

Shows system info from OpenMediaVault: **hostname, version, uptime, CPU and RAM
usage, load average** — via the OMV RPC (`/rpc.php`, `session.login` +
`system.getInformation`).

1. The plugin uses the **web UI login** — `admin` or a dedicated user with
   web interface access.
2. Widget settings: enter **base URL** (e.g. `http://192.168.1.90`),
   **username** (default `admin`) and **password**.
3. Keep **"Allow self-signed certificate"** enabled for HTTPS with
   self-signed certs (default).

Requests run server-side with SSRF protection; the password is stored encrypted.

> **Beta note:** The fields returned by `system.getInformation` **vary between
> OMV versions** — the plugin parses them defensively and hides missing values.
> If CPU/RAM/uptime stay empty for you, please file feedback/an issue
> **including your OMV version** (response JSON appreciated).
