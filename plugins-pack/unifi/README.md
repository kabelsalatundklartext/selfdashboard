# UniFi Controller

Zeigt den Netzwerkstatus aus dem UniFi-Controller: Subsysteme **WLAN / LAN / WAN**
mit Status-Ampel, Anzahl Geräte (APs, Switches, Gateways) und verbundenen Clients.

## Setup

1. Im Controller einen **eigenen lokalen Benutzer** anlegen (UniFi OS → Admins bzw.
   Legacy: Settings → Admins) — am besten **nur mit Lese-Rechten** auf die
   Netzwerk-Anwendung. **Keinen Ubiquiti-Cloud-Account mit 2FA** verwenden,
   der Login läuft direkt gegen den Controller.
2. Widget-Einstellungen: **Controller-URL** (z. B. `https://192.168.1.1` für UDM,
   `https://controller:8443` für Legacy), **Benutzername**, **Passwort**, ggf. **Site**
   (interner Name, Standard `default`).
3. Bei selbstsigniertem Zertifikat die Checkbox **„Selbstsigniertes Zertifikat erlauben“**
   aktiviert lassen (Standard).

**UDM/UniFi OS vs. Legacy-Controller wird automatisch erkannt** — der Login wird
zuerst gegen `/api/auth/login` (UniFi OS) versucht, bei 404 gegen `/api/login` (Legacy).

Die Abfrage läuft **serverseitig** (`/api/plugins/unifi`) mit SSRF-Schutz;
das Passwort wird verschlüsselt gespeichert.

> **Beta-Hinweis:** Getestet gegen UniFi OS (UDM) und Legacy-Controller; bei
> abweichendem Verhalten bitte Issue mit Controller-Version melden.

---

# UniFi Controller (English)

Shows network status from your UniFi controller: **WLAN / LAN / WAN** subsystems
with status light, device count (APs, switches, gateways) and connected clients.

1. Create a **dedicated local user** in the controller (UniFi OS → Admins or
   legacy: Settings → Admins), preferably **read-only** on the Network application.
   **Do not use a Ubiquiti cloud account with 2FA** — login goes directly to the controller.
2. Widget settings: **controller URL** (e.g. `https://192.168.1.1` for UDM,
   `https://controller:8443` for legacy), **username**, **password**, optionally **site**
   (internal name, default `default`).
3. Keep **"Allow self-signed certificate"** enabled for self-signed certs (default).

**UDM/UniFi OS vs. legacy controllers are detected automatically** — login is tried
against `/api/auth/login` (UniFi OS) first, falling back to `/api/login` (legacy) on 404.

Requests run server-side with SSRF protection; the password is stored encrypted.

> **Beta note:** Tested against UniFi OS (UDM) and legacy controllers; please file
> an issue with your controller version if something behaves differently.
