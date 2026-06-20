# Plugin: SelfMailer (`selfmailer`)

[← Plugin index](../../../plugins-pack/README.md) · [Main catalog](../../../README.md#plugins)

## Deutsch

### Kurzbeschreibung

Zeigt **ungelesene Mails über ALLE Postfächer** deines SelfMailer gebündelt an:
Gesamtzahl, je Konto und die neuesten Mails. Das Dashboard spricht **nicht** selbst IMAP —
es liest die fertige Übersicht vom SelfMailer-Server (eine Quelle, Zugangsdaten nur dort).

### Voraussetzung

1. SelfMailer läuft und alle Postfächer sind dort eingerichtet (z. B. `http://192.168.1.10:8090`).
2. SelfMailer-Backend ist aktuell (enthält den Endpoint `GET /api/v1/dashboard/summary`).
3. Plugin **SelfMailer** im **Plugin-Store** installieren → **Strg+F5**.

### Einrichtung

| Feld | Hinweis |
|------|---------|
| **Basis-URL** | SelfMailer-Server, z. B. `http://192.168.1.10:8090` (ohne Pfad) |
| **Token** | Persönlicher Token aus **SelfMailer → Einstellungen → Feeds/Export** |
| **Aktualisierung** | Sekunden zwischen Abrufen (Standard 300; nicht zu niedrig) |

Mit **Verbindung testen** in den Einstellungen prüfst du Basis-URL + Token sofort.

### So funktioniert es

```
Browser ──▶ Dashboard-Server (/api/plugins/selfmailer) ──▶ SelfMailer (/api/v1/dashboard/summary?token=…)
```

Der Abruf läuft **server-zu-server** (kein CORS/Mixed-Content). Jeder Abruf löst auf der
SelfMailer-Seite einen kurzen **INBOX-Sync je Konto** aus und liefert die gebündelte Übersicht.

### Token

Der Token ist der **Feed-Token** von SelfMailer (derselbe wie für Kalender-/Kontakt-Feeds).
Eine Rotation in SelfMailer macht den alten Token sofort ungültig — dann hier neu eintragen.

---

## English

### Summary

Shows **unread mail across ALL mailboxes** of your SelfMailer in one widget: total count,
per account, and the most recent messages. The dashboard does **not** speak IMAP itself —
it reads the ready-made summary from the SelfMailer server (single source, credentials stay there).

### Setup

| Field | Notes |
|-------|-------|
| **Base URL** | SelfMailer server, e.g. `http://192.168.1.10:8090` (no path) |
| **Token** | Personal token from **SelfMailer → Settings → Feeds/Export** |
| **Refresh** | Seconds between fetches (default 300; do not set too low) |

The fetch is **server-to-server** (no CORS/mixed content). Each refresh triggers a short
**INBOX sync per account** on SelfMailer and returns the aggregated summary.
