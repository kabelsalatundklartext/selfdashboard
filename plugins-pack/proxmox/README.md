# Proxmox VE

Zeigt die Proxmox-Knoten mit CPU- und RAM-Auslastung sowie die Anzahl laufender VMs und LXC-Container
(aus `/api2/json/cluster/resources`).

## Setup

1. Proxmox-Weboberfläche → **Datacenter → Permissions → API Tokens** → Token anlegen.
   - Entweder **Privilege Separation** beim Anlegen **deaktivieren**
     (Token erbt die Rechte des Benutzers), **oder**
   - dem Token unter **Permissions** die Rolle **PVEAuditor** auf Pfad `/` geben (nur Lesen — empfohlen).
2. Widget-Einstellungen:
   - **Basis-URL**, z. B. `https://192.168.1.60:8006` (Port 8006 wird automatisch ergänzt).
   - **API-Token** komplett im Format `user@realm!tokenid=uuid`
     (z. B. `dashboard@pve!selfdashboard=aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee`).
   - **Selbstsigniertes Zertifikat erlauben** ist standardmäßig aktiv — Proxmox nutzt ab Werk ein
     selbstsigniertes Zertifikat.
3. Optional: Widget-Titel (leer = ausblenden), Aktualisierungsintervall (Standard 30 s).

Die Abfrage läuft **serverseitig** (`/api/plugins/proxmox`) mit SSRF-Schutz;
das Token wird verschlüsselt gespeichert.

> **Beta-Hinweis:** Getestet gegen Proxmox VE 7/8. Bei abweichenden API-Antworten bitte Issue
> mit Proxmox-Version + Antwort-JSON melden.

---

# Proxmox VE (English)

Shows Proxmox nodes with CPU/RAM usage plus running VM and LXC counts
(from `/api2/json/cluster/resources`).

1. Proxmox web UI → **Datacenter → Permissions → API Tokens** → create a token.
   - Either **disable Privilege Separation** when creating it (token inherits the user's rights), **or**
   - grant the token the **PVEAuditor** role on path `/` under **Permissions** (read-only — recommended).
2. Widget settings:
   - **Base URL**, e.g. `https://192.168.1.60:8006` (port 8006 is added automatically).
   - **API token** as the full string `user@realm!tokenid=uuid`.
   - **Allow self-signed certificate** is enabled by default — Proxmox ships with a self-signed cert.
3. Optional: widget title (empty = hidden), refresh interval (default 30 s).

Requests run server-side with SSRF protection; the token is stored encrypted.

> **Beta note:** Tested against Proxmox VE 7/8. If the API responds differently for you,
> please open an issue with your Proxmox version + response JSON.
