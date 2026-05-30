# Plugin: Aufgaben (`tasks`)

## Deutsch

### Kurzbeschreibung

**CalDAV** (Synology Calendar, Nextcloud), **Google Tasks** und **Microsoft To Do** — Checkbox-Liste mit Zwei-Wege-Sync.

**Wichtig:** Die komplette API (alle Anbieter) liegt **nur** in diesem Plugin-Ordner (`plugins-pack/tasks/`). Es gibt **keinen** Handler im Docker-Image — Plugin aus dem Store installieren (inkl. `server.mjs`).

### Synology / CalDAV

1. Widget **⚙️** → Tab **CalDAV**
2. CalDAV-URL, Benutzer, Passwort → **Speichern**
3. Task-Liste wählen (z. B. Synology **Inbox**)

### Google Tasks

1. [Google Cloud Console](https://console.cloud.google.com/) → OAuth-Client (Web)
2. **Redirect-URI:** `https://DEIN-DASHBOARD/api/plugins/tasks/google/callback`
3. Google Tasks API aktivieren
4. Widget **⚙️** → Tab **Google** → Client ID + Secret → **Mit Google verbinden**

Optional per Docker:

- `SELFDASHBOARD_GOOGLE_TASKS_CLIENT_ID`
- `SELFDASHBOARD_GOOGLE_TASKS_CLIENT_SECRET`
- `SELFDASHBOARD_PUBLIC_URL`

### Microsoft To Do

1. [Azure Portal](https://portal.azure.com/) → App-Registrierungen → Neue Registrierung
2. **Redirect-URI (Web):** `https://DEIN-DASHBOARD/api/plugins/tasks/microsoft/callback`
3. API-Berechtigung: **Microsoft Graph → Tasks.ReadWrite** (delegiert)
4. Client Secret anlegen
5. Widget **⚙️** → Tab **Microsoft** → Client ID, Secret, Tenant (`common` für Privat + Arbeit) → **Mit Microsoft verbinden**

Optional per Docker:

- `SELFDASHBOARD_MICROSOFT_TASKS_CLIENT_ID`
- `SELFDASHBOARD_MICROSOFT_TASKS_CLIENT_SECRET`
- `SELFDASHBOARD_PUBLIC_URL`

### Speicher

`data/users/<id>/tasks/store.json` — Passwörter/Tokens verschlüsselt (`SELFDASHBOARD_CALENDAR_KEY`)

### API-Quellcode (nur dieser Ordner)

| Pfad | Inhalt |
|------|--------|
| `server.ts` / `server.mjs` | HTTP-Routen `/api/plugins/tasks/*`, Sync-Scheduler |
| `lib/caldav.ts` | Synology / CalDAV (VTODO) |
| `lib/google.ts` | Google Tasks (OAuth + REST) |
| `lib/microsoft.ts` | Microsoft To Do (Graph + OAuth) |
| `lib/sync.ts` | Sync für alle Anbieter |

---

## English

### Summary

**CalDAV**, **Google Tasks**, and **Microsoft To Do** — checkbox list with two-way sync. Full API ships only in this plugin folder (`server.mjs` on volume after store install); no image fallback.
