# Plugin: Calendar (`calendar`)

[← Plugin index](README.md) · [Main catalog](../../README.md#plugins)

## Deutsch

### Kurzbeschreibung

Kalender mit **Monat/Woche**, Tagesdetail, **CalDAV** (2-Wege) und **ICS** (read-only). Konten im **Kalender-Modal** (Zahnrad).

### Installation

Plugin-Store → **Kalender** → **Strg+F5** → Konten im Widget-Modal anlegen.

### Kontotypen

| Typ | Richtung | Beispiele |
|-----|----------|-----------|
| **CalDAV** | 2-Wege | Nextcloud, Synology, iCloud |
| **ICS** | Nur lesen | Webcal-URL |

### Speicher & Sicherheit

- Pfad: `data/calendar/` unter **`/app/data`**  
- Passwörter: **AES-256-GCM** mit **`SELFDASHBOARD_CALENDAR_KEY`** (in Docker fest setzen)

### API

`/api/calendar/*` — accounts, events, calendars, sync, status, summary, conflicts

### Sync

Standard alle **5 Min** (`CALENDAR_SYNC_INTERVAL_SECONDS`).

### Fehlerbehebung

Konten weg → Mount `/app/data`, Schlüssel unverändert. Sync-Fehler → URL, App-Passwort.

---

## English

### Summary

Calendar with **month/week** views, day detail, **CalDAV** (two-way) and **ICS** (read-only). Accounts in the **calendar modal** (cog).

### Installation

Plugin Store → **Calendar** → **Ctrl+F5** → add accounts in widget modal.

### Account types

| Type | Direction | Examples |
|------|-----------|----------|
| **CalDAV** | Two-way | Nextcloud, Synology, iCloud |
| **ICS** | Read-only | Webcal URL |

### Storage & security

- Path: `data/calendar/` on **`/app/data`**  
- Passwords: **AES-256-GCM** with **`SELFDASHBOARD_CALENDAR_KEY`** (set fixed key in Docker)

### API

`/api/calendar/*` — accounts, events, calendars, sync, status, summary, conflicts

### Sync

Default every **5 min** (`CALENDAR_SYNC_INTERVAL_SECONDS`).

### Troubleshooting

Missing accounts → mount `/app/data`, same encryption key. Sync errors → URL, app password.
